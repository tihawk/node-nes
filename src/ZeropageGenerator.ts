const util = require('util');
import { AstWithDecoratorsI, DECORATOR } from "./DecoratorParser";
import MemoryManager from "./MemoryManager";

export default class ZeropageGenerator {
  memoryManager: MemoryManager
  constructor(memoryManager: MemoryManager) {
    this.memoryManager = memoryManager;
  }

  generateZeropage(astArr: AstWithDecoratorsI[]): any {
    const charDeclarations = astArr.filter(val => {
      if (val.decorator.type !== DECORATOR.ZEROPAGE) return false;
      if (val.ast.type !== 'VariableDeclaration') return false;
      return true;
    });

    console.log(util.inspect(charDeclarations, { showHidden: false, depth: null, colors: true }))

    return charDeclarations.map(ast => this.traverse(ast.ast)).join('\n');
  }

  traverse(ast: any): any {
    switch(ast.type) {
      case 'VariableDeclaration':
        return ast.declarations.map((declaration: any) => this.traverse(declaration)).join('\n');
      case 'VariableDeclarator':
        if (ast.init === null) {
          // initialised as null. we don't want that in the header segment
          throw new Error(`Undeclared zeropage variable "${ast.id.name}". Use declaration to specify amount of bytes to reserve.`);
        }
        if (ast.init.type === 'Identifier' && ast.init.name === 'undefined') {
          // probably undefined. same as above
          throw new Error(`Undefined zeropage variable "${ast.id.name}". Use declaration to specify amount of bytes to reserve.`);
        }
        this.memoryManager.reserveZeroPageSpace(ast.id.name, ast.init.value || 1);
        return `${ast.id.name}:`.concat(this.traverse(ast.init));
      //case 'ArrayExpression': TODO
      //  return ast.elements.map(((literal: any) => this.traverse(literal))).join('\n');
      case 'Literal':
        const valueType = typeof ast.value
        if (valueType !== 'number') {
          throw new Error(`Unsupported data type. Expected number, got "${typeof ast.value}".`);
        }
        const value = valueType === 'number' ? `${ast.value.toString(16)}` : `"${ast.value}"`;
        return ` .res ${value || 1}\n`;
    }
  }

}
