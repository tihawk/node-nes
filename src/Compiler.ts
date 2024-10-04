import CharsGenerator from "./CharsGenerator";
import CodeGenerator from "./CodeGenerator";
import DecoratorParser from "./DecoratorParser";
import HeaderGenerator from "./HeaderGenerator";
import MemoryManager from "./MemoryManager";
import RodataGenerator from "./RodataGenerator";
import { defaultBssSegment, defaultVectorsSegment, defaultZeropageSegment, irq, nmi, reset } from "./util/asm"
const esprima = require('esprima');
const util = require('util')

// Compiler: Manages the whole compilation process
export default class Compiler {
  memoryManager: MemoryManager
  decoratorParser: DecoratorParser
  headerGenerator: HeaderGenerator
  rodataGenerator: RodataGenerator
  codeGenerator: CodeGenerator
  charsGenerator: CharsGenerator
  header: string
  startup: string
  zeropage: string
  rodata: string
  code: string
  vectors: string
  bss: string
  chars: string
  constructor() {
    this.memoryManager = new MemoryManager();
    this.decoratorParser = new DecoratorParser();
    this.headerGenerator = new HeaderGenerator();
    this.rodataGenerator = new RodataGenerator(this.memoryManager);
    this.codeGenerator = new CodeGenerator(this.memoryManager);
    this.charsGenerator = new CharsGenerator();
    this.header = '\n.segment "HEADER"\n\n';
    this.startup = '\n.segment "STARTUP"\n\n';
    this.zeropage = '\n.segment "ZEROPAGE"\n\n';
    this.rodata = '\n.segment "RODATA"\n\n';
    this.code = '\n.segment "CODE"\n\n';
    this.vectors = '\n.segment "VECTORS"\n\n';
    this.bss = '\n.segment "BSS"\n\n';
    this.chars = '\n.segment "CHARS"\n\n';
  }

  compile(jsCode: string) {
    const ast = esprima.parse(jsCode, { sourceType: 'module', comment: true, loc: true });
    console.log(util.inspect(ast, { showHidden: false, depth: null, colors: true }));

    const {decorated, undecorated} = this.decoratorParser.parse(ast);

    this.header = this.header.concat(this.headerGenerator.generateHeader(decorated));

    this.rodata = this.rodata.concat(this.rodataGenerator.generateRodata(decorated));

    this.code = this.code.concat(this.codeGenerator.generateCodeSegment(undecorated));

    // Hardcode Vectors segment stuff
    defaultZeropageSegment.forEach((val) => {
      this.zeropage = this.zeropage.concat(
        `${val[0]}: .res ${this.memoryManager.reserveZeroPageSpace(
          val[0] as string,
          val[1] as number,
        )}\n`,
      );
    });
    this.vectors = this.vectors.concat(defaultVectorsSegment);
    this.code = this.code.concat(nmi).concat(reset).concat(irq);
    defaultBssSegment.forEach((val) => {
      this.memoryManager.storeLabel(val[0] as string)
      this.bss = this.bss.concat(`${val[0]}: .res ${val[1]}\n`);
    });

    this.chars = this.chars.concat(this.charsGenerator.generateChars(decorated))

    return [this.header, this.startup, this.zeropage, this.rodata, this.code, this.vectors, this.bss, this.chars].join('\n');
  }
}
