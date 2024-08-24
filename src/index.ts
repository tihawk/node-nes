import Compiler from "./Compiler";

// Example usage
const jsCode = `
const classObject = new SomeClass()
let str = 'string'
let a = 5;
let b = 10;
let c = a + b;
`;

const compiler = new Compiler();
const nesAssemblyCode = compiler.compile(jsCode);
console.log(nesAssemblyCode);