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
        const hexValue = ast.value.toString(16);
        if (ast.value == parseInt(hexValue, 16)) {
          if (ast.value > 255) throw new Error (`Integers bigger than 255 not supported: ${ast.value}`);
          // value is an integer
          return `LDA #$${hexValue}`;
        } else {
          // TODO implement storing strings as an array of bytes
          throw new Error(`Only integers are allowed to be initialised as literals. Passed value: ${ast.value}`)
        }

      case 'NewExpression': // TODO
        throw new Error(`Variable declarators of type NewExpression are not implemented: ${util.inspect(ast, {showHidden: false, depth: null, colors: true})}`)

      case 'BinaryExpression':
        const left = this.generateAssembly(ast.left);
        const right = this.generateAssembly(ast.right);
        const operator = ast.operator;
        switch (operator) {
          case '+':
            // works only with 8-bit addition right now
            return `${left}\nSTA TEMP\n${right}\nCLC\nADC TEMP`;
          case '-':
            return `${right}\nSTA TEMP\n${left}\nSEC\nSBC TEMP`;
          default:
            throw new Error(`Unsupported binary expression operator: ${operator}`);
        }

      case 'Identifier': // allocates memory for the variable
        const identifierLocation = this.memoryManager.getMemoryLocation(ast.name);
        return `LDA ${identifierLocation}`;

      case 'ExpressionStatement': // TODO
        throw new Error(`Variable declarators of type ExpressionStatement are not implemented: ${util.inspect(ast, {showHidden: false, depth: null, colors: true})}`)

      default:
        throw new Error(`Unknown AST node type: ${ast.type}`);
    }
  }
}