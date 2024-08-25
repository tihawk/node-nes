import Compiler from "./Compiler";

// Example usage
const jsCode = `
// function makeStruct(names) {
//   var names = names.split(' ');
//   var count = names.length;
//   function constructor() {
//     for (var i = 0; i < count; i++) {
//       this[names[i]] = arguments[i];
//     }
//   }
//   return constructor;
// }

// var Item = makeStruct("id speaker country");
// var row = new Item(1, 'john', 'au');
let a = 5;
let b = 10;
let c = a + 255;
let d = b - a;

function calculate(a, b) {
  let c = a + b;
  return c;
}

const added = calculate(a, b);
`;

const compiler = new Compiler();
const nesAssemblyCode = compiler.compile(jsCode);
console.log(nesAssemblyCode);