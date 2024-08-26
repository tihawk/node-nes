import MemoryManager from "./MemoryManager";
const util = require('util');

// Code Generator: Converts AST to NES assembly
export default class CodeGenerator {
  memoryManager: MemoryManager
  constructor(memoryManager: MemoryManager) {
    this.memoryManager = memoryManager;
  }

  generateCodeSegment(ast: any): any {
    switch (ast.type) {
      case 'Program':
        return ast.body.map((statement: any) => this.generateCodeSegment(statement)).join('\n');

      case 'VariableDeclaration':
        return this.generateVariableDeclaration(ast);

      case 'VariableDeclarator':
        return this.generateVariableDeclarator(ast);

      case 'ExpressionStatement':
        return this.generateCodeSegment(ast.expression);

      case 'AssignmentExpression':
        return this.generateAssignmentExpression(ast);

      case 'Literal': // a number or string (or w/e other literals there are)
        return this.generateLiteral(ast);

      case 'NewExpression': // TODO
        throw new Error(`Variable declarators of type NewExpression are not implemented: ${util.inspect(ast, { showHidden: false, depth: null, colors: true })}`)

      case 'BinaryExpression':
        return this.generateBinaryExpression(ast);

      case 'Identifier': // allocates memory for the variable
        return this.generateIdentifier(ast);

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

  /* GENERIC JAVASCRIPT TOKENS */

  generateVariableDeclaration(ast: any) {
    return ast.declarations.map((declaration: any) => this.generateCodeSegment(declaration)).join('\n');
  }

  generateVariableDeclarator(ast: any) {
    if (ast.init === null) return; // initialised as null. we don't want that in the code segment
    if (ast.init.type === 'Identifier' && ast.init.name === 'undefined') return; // probably undefined. same as above
    const varName = ast.id.name;
    const varLocation = this.memoryManager.getMemoryLocation(varName);
    const initValue = this.generateCodeSegment(ast.init);
    return `${initValue}\nSTA ${varLocation}`;
  }

  generateAssignmentExpression(ast: any) {
    const varName = ast.left.name;            // Get the variable name from the LHS
    const varLocation = this.memoryManager.getMemoryLocation(varName); // Get its memory location
    const value = this.generateCodeSegment(ast.right); // Generate assembly for the RHS
    return `${value}\nSTA ${varLocation}`; // Store the RHS value in the LHS variable's location
  }

  generateLiteral(ast: any) {
    const hexValue = ast.value.toString(16);
    if (ast.value == parseInt(hexValue, 16)) {
      if (ast.value > 255) throw new Error(`Integers bigger than 255 not supported: ${ast.value}`);
      // value is an integer
      return `LDA #$${hexValue}`;
    } else {
      // TODO implement storing strings as an array of bytes
      throw new Error(`Only integers are allowed to be initialised as literals. Passed value: ${ast.value}`)
    }
  }

  generateBinaryExpression(ast: any) {
    const left = this.generateCodeSegment(ast.left);
    const right = this.generateCodeSegment(ast.right);
    const operator = ast.operator;

    switch (operator) {
      case '+':
        return `${left}\nSTA TEMP\n${right}\nCLC\nADC TEMP`;
      case '-':
        return `${right}\nSTA TEMP\n${left}\nSEC\nSBC TEMP`;
      // case '*': TODO implement multiply and divide subroutines
      //     return `${left}\nSTA MULTIPLICAND\n${right}\nSTA MULTIPLIER\nJSR multiply`;
      // case '/':
      //     return `${left}\nSTA DIVIDEND\n${right}\nSTA DIVISOR\nJSR divide`;
      case '&':
        return `${right}\nSTA TEMP\n${left}\nAND TEMP`;
      case '|':
        return `${right}\nSTA TEMP\n${left}\nORA TEMP`;
      case '^':
        return `${right}\nSTA TEMP\n${left}\nEOR TEMP`;
      case '==':
        return `${right}\nSTA TEMP\n${left}\nCMP TEMP\nBEQ equal\nLDA #0\nJMP end\n equal:\nLDA #1\n end:`;
      case '!=':
        return `${right}\nSTA TEMP\n${left}\nCMP TEMP\nBNE not_equal\nLDA #0\nJMP end\n not_equal:\nLDA #1\n end:`;
      case '<':
        return `${right}\nSTA TEMP\n${left}\nCMP TEMP\nBCC less_than\nLDA #0\nJMP end\n less_than:\nLDA #1\n end:`;
      case '>':
        return `${right}\nSTA TEMP\n${left}\nCMP TEMP\nBCS greater_than\nLDA #0\nJMP end\n greater_than:\nLDA #1\n end:`;
      case '<=':
        return `${right}\nSTA TEMP\n${left}\nCMP TEMP\nBCC less_equal\nBEQ less_equal\nLDA #0\nJMP end\n less_equal:\nLDA #1\n end:`;
      case '>=':
        return `${right}\nSTA TEMP\n${left}\nCMP TEMP\nBCS greater_equal\nBEQ greater_equal\nLDA #0\nJMP end\n greater_equal:\nLDA #1\n end:`;
      default:
        throw new Error(`Unsupported binary operator: ${operator}`);
    }
  }

  generateIdentifier(ast: any) {
    const identifierLocation = this.memoryManager.getMemoryLocation(ast.name);
    return `LDA ${identifierLocation}`;
  }

  generateFunctionDeclaration(ast: any) {
    const functionName = ast.id.name;
    const functionLabel = `${functionName}_func`;

    // Generate code for function body
    const functionBody = ast.body.body
      .map(
        (statement: any) => (this.generateCodeSegment(statement)
          .split('\n')
          .map((line: string) => "  ".concat(line))
          .join('\n'))
      ).join('\n');

    // Create function label and body
    return `${functionLabel}:\n${functionBody}`;
  }

  generateBlockStatement(ast: any) {
    // Iterate over each statement in the block and generate assembly for it
    return ast.body.map((statement: any) => this.generateCodeSegment(statement)).join('\n');
  }

  generateCallExpression(ast: any) {
    const functionName = ast.callee.name;
    return `JSR ${functionName}_func`;
  }

  generateReturnStatement(ast: any) {
    // Handle return value, if any (basically loads it into the A register)
    let returnValue = '';
    if (ast.argument) {
      returnValue = this.generateCodeSegment(ast.argument);
    }

    // Ensure the return value is in the accumulator and then return from the function
    return `${returnValue}\nRTS`;
  }

}