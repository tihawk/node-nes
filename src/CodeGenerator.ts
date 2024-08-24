import MemoryManager from "./MemoryManager";
const util = require('util');

// Code Generator: Converts AST to NES assembly
export default class CodeGenerator {
  memoryManager: MemoryManager
  constructor(memoryManager: MemoryManager) {
    this.memoryManager = memoryManager;
  }

  generateAssembly(ast: any): any {
    switch (ast.type) {
      case 'Program':
        return ast.body.map((statement: any) => this.generateAssembly(statement)).join('\n');

      case 'VariableDeclaration':
        return ast.declarations.map((declaration: any) => this.generateAssembly(declaration)).join('\n');

      case 'VariableDeclarator':
        const varName = ast.id.name;
        const varLocation = this.memoryManager.getMemoryLocation(varName);
        const initValue = this.generateAssembly(ast.init);
        return `${initValue}\nSTA ${varLocation}`;

      case 'Literal': // a number or string (or w/e other literals there are)
        return `LDA #$${ast.value.toString(16)}`;

      case 'NewExpression': // TODO
        throw new Error(`Variable declarators of type NewExpression are not implemented: ${util.inspect(ast, {showHidden: false, depth: null, colors: true})}`)

      case 'BinaryExpression': // works only with addition right now
        const left = this.generateAssembly(ast.left);
        const right = this.generateAssembly(ast.right);
        const operator = ast.operator;
        return `${left}\nSTA TEMP\n${right}\nCLC\nADC TEMP`;

      case 'Identifier': // allocates memory for the variable
        const identifierLocation = this.memoryManager.getMemoryLocation(ast.name);
        return `LDA ${identifierLocation}`;

      default:
        throw new Error(`Unknown AST node type: ${ast.type}`);
    }
  }
}