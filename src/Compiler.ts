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
      const ast = esprima.parseScript(jsCode);
      console.log(util.inspect(ast, {showHidden: false, depth: null, colors: true}))
      return this.codeGenerator.generateAssembly(ast);
  }
}