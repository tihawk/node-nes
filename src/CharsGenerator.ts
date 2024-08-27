const util = require('util');
import { AstWithDecoratorsI, DECORATOR } from "./DecoratorParser";

export default class CharsGenerator {
  constructor() { }

  generateChars(astArr: AstWithDecoratorsI[]): any {
    const charDeclarations = astArr.filter(val => {
      if (val.decorator.type !== DECORATOR.CHAR) return false;
      if (val.ast.type !== 'VariableDeclaration') return false;
      return true;
    });

    return charDeclarations.map(ast => this.traverse(ast.ast)).join('\n');
  }

  traverse(ast: any): any {
    switch(ast.type) {
      case 'VariableDeclaration':
        return ast.declarations.map((declaration: any) => this.traverse(declaration)).join('\n');
      case 'VariableDeclarator':
        if (ast.init === null) {
          // initialised as null. we don't want that in the chars segment
          throw new Error(`Undeclared char "${ast.id.name}".`);
        }
        if (ast.init.type === 'Identifier' && ast.init.name === 'undefined') {
          // probably undefined. same as above
          throw new Error(`Undefined char "${ast.id.name}".`);
        }
        const initValue = this.traverse(ast.init);
        return `    .incbin "${initValue}"\n`;
      case 'Literal':
        if (!String(ast.value).endsWith('.chr')) {
          throw new Error(`Unknown file extension. Expected "*.chr", got "${ast.value}".`);
        }
        return ast.value;
    }
  }

}