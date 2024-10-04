import MemoryManager from "./MemoryManager";
const util = require('util');

// Code Generator: Converts AST to NES assembly
export default class CodeGenerator {
  memoryManager: MemoryManager
  ifLabelCounter: number
  compareLabelCounter: number
  constructor(memoryManager: MemoryManager) {
    this.memoryManager = memoryManager;
    this.ifLabelCounter = 0; // Counter to create unique labels for branches
    this.compareLabelCounter = 0;
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

      case 'IfStatement':
        return this.generateIfStatement(ast);

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
    const varLocation = this.memoryManager.getOrSetMemory(varName);
    const initValue = this.generateCodeSegment(ast.init);
    return `${initValue}\n    STA ${varLocation}`;
  }

  generateAssignmentExpression(ast: any) {
    const varName = ast.left.name;            // Get the variable name from the LHS
    const varLocation = this.memoryManager.getOrSetMemory(varName); // Get its memory location
    const value = this.generateCodeSegment(ast.right); // Generate assembly for the RHS
    return `${value}\n    STA ${varLocation}`; // Store the RHS value in the LHS variable's location
  }

  generateLiteral(ast: any) {
    const hexValue = ast.value.toString(16);
    if (ast.value == parseInt(hexValue, 16)) {
      if (ast.value > 255) throw new Error(`Integers bigger than 255 not supported: ${ast.value}`);
      // value is an integer
      return `    LDA #$${hexValue}`;
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
        return `${left}\n    STA TEMP\n${right}\n    CLC\n    ADC TEMP`;
      case '-':
        return `${right}\n    STA TEMP\n${left}\n    SEC\n    SBC TEMP`;
      // case '*': TODO implement multiply and divide subroutines
      //     return `${left}\n    STA MULTIPLICAND\n${right}\n    STA MULTIPLIER\n    JSR multiply`;
      // case '/':
      //     return `${left}\n    STA DIVIDEND\n${right}\n    STA DIVISOR\n    JSR divide`;
      case '&':
        return `${right}\n    STA TEMP\n${left}\n    AND TEMP`;
      case '|':
        return `${right}\n    STA TEMP\n${left}\n    ORA TEMP`;
      case '^':
        return `${right}\n    STA TEMP\n${left}\n    EOR TEMP`;
      case '==':
        return `${left}\n    STA TEMP\n${right}\n    CMP TEMP\n    BEQ lbl_equal_${++this.compareLabelCounter}\n    LDA #0\n    JMP lbl_end_${this.compareLabelCounter}\nlbl_equal_${this.compareLabelCounter}:\n    LDA #1\nlbl_end_${this.compareLabelCounter}:`;
      case '!=':
        return `${left}\n    STA TEMP\n${right}\n    CMP TEMP\n    BNE lbl_not_equal_${++this.compareLabelCounter}\n    LDA #0\n    JMP lbl_end_${this.compareLabelCounter}\nlbl_not_equal_${this.compareLabelCounter}:\n    LDA #1\nlbl_end_${this.compareLabelCounter}:`;
      case '<':
        return `${right}\n    STA TEMP\n${left}\n    CMP TEMP\n    BCC lbl_less_than_${++this.compareLabelCounter}\n    LDA #0\n    JMP lbl_end_${this.compareLabelCounter}\nlbl_less_than_${this.compareLabelCounter}:\n    LDA #1\nlbl_end_${this.compareLabelCounter}:`;
      case '>':
        return `${right}\n    STA TEMP\n${left}\n    CMP TEMP\n    BEQ lbl_end_${++this.compareLabelCounter}\n    BCS lbl_greater_than_${this.compareLabelCounter}\n    LDA #0\n    JMP lbl_end_${this.compareLabelCounter}\nlbl_greater_than_${this.compareLabelCounter}:\n    LDA #1\nlbl_end_${this.compareLabelCounter}:`;
      case '<=':
        return `${right}\n    STA TEMP\n${left}\n    CMP TEMP\n    BCC lbl_less_equal_${++this.compareLabelCounter}\n    BEQ lbl_less_equal_${this.compareLabelCounter}\n    LDA #0\n    JMP lbl_end_${this.compareLabelCounter}\nlbl_less_equal_${this.compareLabelCounter}:\n    LDA #1\nlbl_end_${this.compareLabelCounter}:`;
      case '>=':
        return `${right}\n    STA TEMP\n${left}\n    CMP TEMP\n    BCS lbl_greater_equal_${++this.compareLabelCounter}\n    LDA #0\n    JMP lbl_end_${this.compareLabelCounter}\nlbl_greater_equal_${this.compareLabelCounter}:\n    LDA #1\nlbl_end_${this.compareLabelCounter}:`;
      default:
        throw new Error(`Unsupported binary operator: ${operator}`);
    }
  }

  generateIdentifier(ast: any) {
    const identifierLocation = this.memoryManager.getOrSetMemory(ast.name);
    return `    LDA ${identifierLocation}`;
  }

  generateFunctionDeclaration(ast: any) {
    const functionName = ast.id.name;
    const functionLabel = `${functionName}_func`;

    // Generate code for function body
    const functionBody = ast.body.body
      .map(
        (statement: any) => (this.generateCodeSegment(statement))).join('\n');

    // Create function label and body
    return `${functionLabel}:\n${functionBody}`;
  }

  generateBlockStatement(ast: any) {
    // Iterate over each statement in the block and generate assembly for it
    return ast.body.map((statement: any) => this.generateCodeSegment(statement)).join('\n');
  }

  generateCallExpression(ast: any) {
    const functionName = ast.callee.name;
    return `    JSR ${functionName}_func`;
  }

  generateReturnStatement(ast: any) {
    // Handle return value, if any (basically loads it into the A register)
    let returnValue = '';
    if (ast.argument) {
      returnValue = this.generateCodeSegment(ast.argument);
    }

    // Ensure the return value is in the accumulator and then return from the function
    return `${returnValue}    RTS\n`;
  }

  generateIfStatement(ast: any) {
    const labelIndex = this.ifLabelCounter++;
    const testCode = this.generateCodeSegment(ast.test);
    const consequentCode = this.generateCodeSegment(ast.consequent);

    let code = `${testCode}\n    BEQ else_${labelIndex}\n${consequentCode}\n    JMP endif_${labelIndex}`;

    if (ast.alternate) {
      const alternateCode = this.generateCodeSegment(ast.alternate);
      code += `\nelse_${labelIndex}:\n${alternateCode}`;
    }

    code += `\nendif_${labelIndex}:`;

    return code;
  }

}
