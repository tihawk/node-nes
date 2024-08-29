export enum DECORATOR {
  ZEROPAGE = '@zeropage',
  HEADER = '@header',
  BYTE = '@byte',
  WORD = '@word',
  DWORD = '@dword',
  CHAR = '@char'
}

export interface LocI {
  start: { line: number, column: number }, end: { line: number, column: number }
}

export interface DecoratorI {
  type: DECORATOR
  loc: LocI
}

export interface AstWithDecoratorsI {
  ast: any
  index: number
  decorator: DecoratorI
}

export interface DecoratorParseReturn {
  undecorated: any
  decorated: AstWithDecoratorsI[]
}

export default class DecoratorParser {
  constructor() { }

  parse(ast: any): DecoratorParseReturn {
    const body = ast.body;
    const comments = ast.comments;
    const decoratorTypes = Object.values(DECORATOR);

    const decorators: DecoratorI[] = comments
      .filter((comment: any) => comment.type === 'Line' && decoratorTypes.includes(comment.value.trim()))
      .map((decoratorComment: { value: string, loc: LocI }) => ({
        type: decoratorComment.value.trim(),
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


    const astIndices = decoratedAsts.map(val => val.index)
    const filteredBody = body.filter((ast: any, index: number) => !astIndices.includes(index));
    const filteredAst = {
      ...ast,
      body: filteredBody
    }

    return {
      undecorated: filteredAst,
      decorated: decoratedAsts
    }

  }
}