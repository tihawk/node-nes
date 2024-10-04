const util = require('util');
import { AstWithDecoratorsI, DECORATOR } from "./DecoratorParser";
import MemoryManager from "./MemoryManager";

export default class RodataGenerator {
  memoryManager: MemoryManager
  constructor(memoryManager: MemoryManager) {
    this.memoryManager = memoryManager;
  }

  generateRodata(astArr: AstWithDecoratorsI[]): any {
    const charDeclarations = astArr.filter(val => {
      if (val.decorator.type !== DECORATOR.RODATA) return false;
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
          throw new Error(`Undeclared rodata array "${ast.id.name}".`);
        }
        if (ast.init.type === 'Identifier' && ast.init.name === 'undefined') {
          // probably undefined. same as above
          throw new Error(`Undefined rodata array "${ast.id.name}".`);
        }
        this.memoryManager.storeLabel(ast.id.name);
        return `${ast.id.name}:\n`.concat(this.traverse(ast.init));
      case 'ArrayExpression':
        return ast.elements.map(((literal: any) => this.traverse(literal))).join('\n');
      case 'Literal':
        const valueType = typeof ast.value
        if ((valueType !== 'number') && (valueType !== 'string')) {
          throw new Error(`Unsupported data type. Expected number or string, got "${typeof ast.value}".`);
        }
        const value = valueType === 'number' ? `$${ast.value.toString(16)}` : `"${ast.value}"`;
        return `    .byte ${value}`;
    }
  }

}
