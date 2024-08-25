import CodeGenerator from "./CodeGenerator";
import MemoryManager from "./MemoryManager";
const esprima = require('esprima');
const util = require('util')

// Compiler: Manages the whole compilation process
export default class Compiler {
  memoryManager: MemoryManager
  codeGenerator: CodeGenerator
  header: string
  startup: string
  zeropage: string
  code: string
  vectors: string
  chars: string
  constructor() {
    this.memoryManager = new MemoryManager();
    this.codeGenerator = new CodeGenerator(this.memoryManager);
    this.header = `
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
    this.startup = '.segment "STARTUP"\n\n';
    this.zeropage = '.segment "ZEROPAGE"\n\n';
    this.code = '.segment "CODE"\n\n';
    this.vectors = '.segment "VECTORS"\n\n';
    this.chars = '.segment "CHARS"\n\n';
  }

  compile(jsCode: string) {
    const ast = esprima.parse(jsCode, { sourceType: 'module' });
    console.log(util.inspect(ast, { showHidden: false, depth: null, colors: true }));

    this.zeropage = this.zeropage.concat(`TEMP: .res ${this.memoryManager.reserveZeroPageSpace('TEMP')}\n`);

    this.code = this.code.concat(this.codeGenerator.generateCodeSegment(ast));

    return [this.header, this.startup, this.zeropage, this.code, this.vectors, this.chars].join('\n');
  }
}