import CodeGenerator from "./CodeGenerator";
import MemoryManager from "./MemoryManager";
const esprima = require('esprima');
const util = require('util')

// Compiler: Manages the whole compilation process
export default class Compiler {
  memoryManager: MemoryManager
  codeGenerator: CodeGenerator
  constructor() {
      this.memoryManager = new MemoryManager();
      this.codeGenerator = new CodeGenerator(this.memoryManager);
  }

  compile(jsCode: string) {
      const ast = esprima.parse(jsCode, { sourceType: 'module' });
      console.log(util.inspect(ast, {showHidden: false, depth: null, colors: true}));
      let header = `
.segment "HEADER"

.byte "NES"     ; boilerplate
.byte $1a       ; boilerplate
.byte $04       ; 4 - 2*16k PRG ROM
.byte $01       ; 5 - 8k CHR ROM
.byte %00000001 ; 6 - mapper - horizontal mirroring <- refers to how graphics are organised (horizontal or vertical mirroring, depending on how the game scrolls) four-screen mirroring?
.byte $00       ; 7 - 
.byte $00       ; 8 - 
.byte $00       ; 9 - NTSC
.byte $00
.byte $00, $00, $00, $00, $00 ; Filler
      `;

      let startup = '.segment "STARTUP"\n\n';

      let zeropage = '.segment "ZEROPAGE"\n\n';
      zeropage = zeropage.concat(`TEMP: .res ${this.memoryManager.reserveZeroPageSpace('TEMP')}\n`);

      let code = '.segment "CODE"\n\n'
      code = code.concat(this.codeGenerator.generateCodeSegment(ast));

      let vectors = '.segment "VECTORS"\n\n';

      let chars = '.segment "CHARS"\n\n';

      return [header, startup, zeropage, code, vectors, chars].join('\n');
  }
}