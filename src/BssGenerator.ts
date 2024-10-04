const util = require('util');
import { AstWithDecoratorsI, DECORATOR } from "./DecoratorParser";
import MemoryManager from "./MemoryManager";

export default class BssGenerator {
  memoryManager: MemoryManager
  constructor(memoryManager: MemoryManager) {
    this.memoryManager = memoryManager;
  }

  generateBss(astArr: AstWithDecoratorsI[]): any {
    const charDeclarations = astArr.filter(val => {
      if (val.decorator.type !== DECORATOR.BSS) return false;
      if (val.ast.type !== 'VariableDeclaration') return false;
      return true;
    });

    console.log(util.inspect(charDeclarations, { showHidden: false, depth: null, colors: true }))

    return charDeclarations.map(ast => this.traverse(ast.ast)).join('');
  }

  traverse(ast: any): any {
    switch(ast.type) {
      case 'VariableDeclaration':
        return ast.declarations.map((declaration: any) => this.traverse(declaration)).join('\n');
      case 'VariableDeclarator': {
        if (ast.init === null) {
          // initialised as null. we don't want that in the header segment
          throw new Error(`Undeclared bss variable "${ast.id.name}". Use declaration to specify amount of bytes to reserve.`);
        }
        if (ast.init.type === 'Identifier' && ast.init.name === 'undefined') {
          // probably undefined. same as above
          throw new Error(`Undefined bss variable "${ast.id.name}". Use declaration to specify amount of bytes to reserve.`);
        }
        let identifier = `${ast.id.name}`
        if (ast.init.type === 'ObjectExpression') {
          identifier = `.scope ${identifier}\n`
        }
        this.memoryManager.reserveZeroPageSpace(ast.id.name, ast.init.value || 1);
        return identifier.concat(this.traverse(ast.init));
      }
      //case 'ArrayExpression': TODO
      //  return ast.elements.map(((literal: any) => this.traverse(literal))).join('\n');
      case 'ObjectExpression': {
        const scopeEnd = '.endscope\n';
        return ast.properties.map((literal: any) => this.traverse(literal)).join('').concat(scopeEnd);
      }
      case 'Property':
        return `${ast.key.name}`.concat(this.traverse(ast.value));
      case 'Literal': {
        const valueType = typeof ast.value
        if (valueType !== 'number') {
          throw new Error(`Unsupported data type. Expected number, got "${typeof ast.value}".`);
        }
        const value = valueType === 'number' ? `${ast.value.toString(16)}` : `"${ast.value}"`;
        return `: .res ${value || 1}\n`;
      }
    }
  }

}
