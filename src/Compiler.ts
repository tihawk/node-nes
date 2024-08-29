import CharsGenerator from "./CharsGenerator";
import CodeGenerator from "./CodeGenerator";
import DecoratorParser from "./DecoratorParser";
import HeaderGenerator from "./HeaderGenerator";
import MemoryManager from "./MemoryManager";
const esprima = require('esprima');
const util = require('util')

// Compiler: Manages the whole compilation process
export default class Compiler {
  memoryManager: MemoryManager
  decoratorParser: DecoratorParser
  headerGenerator: HeaderGenerator
  codeGenerator: CodeGenerator
  charsGenerator: CharsGenerator
  header: string
  startup: string
  zeropage: string
  code: string
  vectors: string
  chars: string
  constructor() {
    this.memoryManager = new MemoryManager();
    this.decoratorParser = new DecoratorParser();
    this.headerGenerator = new HeaderGenerator();
    this.codeGenerator = new CodeGenerator(this.memoryManager);
    this.charsGenerator = new CharsGenerator();
    this.header = '\n.segment "HEADER"\n\n';
    this.startup = '\n.segment "STARTUP"\n\n';
    this.zeropage = '\n.segment "ZEROPAGE"\n\n';
    this.code = '\n.segment "CODE"\n\n';
    this.vectors = '\n.segment "VECTORS"\n\n';
    this.chars = '\n.segment "CHARS"\n\n';
  }

  compile(jsCode: string) {
    const ast = esprima.parse(jsCode, { sourceType: 'module', comment: true, loc: true });
    // console.log(util.inspect(ast, { showHidden: false, depth: null, colors: true }));

    const {decorated, undecorated} = this.decoratorParser.parse(ast);

    this.header = this.header.concat(this.headerGenerator.generateHeader(decorated));

    this.zeropage = this.zeropage.concat(`TEMP: .res ${this.memoryManager.reserveZeroPageSpace('TEMP')}\n`);

    this.code = this.code.concat(this.codeGenerator.generateCodeSegment(undecorated));

    this.chars = this.chars.concat(this.charsGenerator.generateChars(decorated))

    return [this.header, this.startup, this.zeropage, this.code, this.vectors, this.chars].join('\n');
  }
}