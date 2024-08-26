const util = require('util');

export enum DECORATOR {
  ZEROPAGE = '@zeropage',
  BYTE = '@byte',
  WORD = '@word'
}

export interface LocI {
  start: { line: number, column: number }, end: { line: number, column: number }
}

export interface DecoratorI {
  decorator: DECORATOR
  loc: LocI
}

export interface AstWithDecoratorsI {
  ast: any
  index: number
  decorator: DecoratorI
}

export default class DecoratorParser {
  astWithDecorators: AstWithDecoratorsI[]
  constructor() {
    this.astWithDecorators = []
  }

  parse(ast: any) {
    const body = ast.body;
    const comments = ast.comments;
    const decoratorTypes = Object.values(DECORATOR);

    const decorators: DecoratorI[] = comments
      .filter((comment: any) => comment.type === 'Line' && decoratorTypes.includes(comment.value.trim()))
      .map((decoratorComment: { value: string, loc: LocI }) => ({
        decorator: decoratorComment.value.trim(),
        loc: decoratorComment.loc
      } as DecoratorI));

    const decoratedAsts: AstWithDecoratorsI[] = [];
    decorators.forEach(decorator => {
      const correspondingAstIndex = body.findIndex((ast: any) => {
        if (ast.loc.start.line >= decorator.loc.end.line) {
          const isImmediate = !body.some((otherAst: any) => {
            return otherAst.loc.start.line > decorator.loc.end.line && otherAst.loc.start.line < ast.loc.start.line;
          });
          return isImmediate
        }
        return false;
      });
      if (correspondingAstIndex > -1) {
        decoratedAsts.push({
          ast: body[correspondingAstIndex],
          decorator,
          index: correspondingAstIndex
        })
      }
    });

    console.log(util.inspect(decoratedAsts, { showHidden: false, depth: null, colors: true }));


  }
}