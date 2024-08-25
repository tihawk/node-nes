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
          if (ast.value > 255) throw new Error(`Integers bigger than 255 not supported: ${ast.value}`);
          // value is an integer
          return `LDA #$${hexValue}`;
        } else {
          // TODO implement storing strings as an array of bytes
          throw new Error(`Only integers are allowed to be initialised as literals. Passed value: ${ast.value}`)
        }

      case 'NewExpression': // TODO
        throw new Error(`Variable declarators of type NewExpression are not implemented: ${util.inspect(ast, { showHidden: false, depth: null, colors: true })}`)

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
        throw new Error(`Variable declarators of type ExpressionStatement are not implemented: ${util.inspect(ast, { showHidden: false, depth: null, colors: true })}`)

      case 'FunctionDeclaration':
        return this.generateFunctionDeclaration(ast);

      case 'BlockStatement':
        return this.generateBlockStatement(ast);

      case 'ReturnStatement':
        return this.generateReturnStatement(ast);

      case 'CallExpression':
        return this.generateCallExpression(ast);

      default:
        throw new Error(`Unknown AST node type: ${ast.type}`);
    }
  }

  generateFunctionDeclaration(ast: any) {
    const functionName = ast.id.name;
    const functionLabel = `${functionName}_func`;

    // Generate code for function body
    const functionBody = ast.body.body
      .map(
        (statement: any) => (this.generateAssembly(statement)
          .split('\n')
          .map((line: string) => "  ".concat(line))
          .join('\n'))
      ).join('\n');

    // Create function label and body
    return `${functionLabel}:\n${functionBody}`;
  }

  generateBlockStatement(ast: any) {
    // Iterate over each statement in the block and generate assembly for it
    return ast.body.map((statement: any) => this.generateAssembly(statement)).join('\n');
  }

  generateCallExpression(ast: any) {
    const functionName = ast.callee.name;
    return `JSR ${functionName}_func`;
  }

  generateReturnStatement(ast: any) {
    // Handle return value, if any (basically loads it into the A register)
    let returnValue = '';
    if (ast.argument) {
      returnValue = this.generateAssembly(ast.argument);
    }

    // Ensure the return value is in the accumulator and then return from the function
    return `${returnValue}\nRTS`;
  }

}