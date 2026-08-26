// String/Boolean/Number called as FUNCTIONS: the conversion operators.
// String(x) is the template-literal ToString (JS-exact number formatting),
// Boolean(x) is ToBoolean (0/-0/NaN/"" falsy, objects truthy), Number(x)
// passes numbers through and maps booleans to 1/0. Zero-arg forms are the
// JS constants.

console.log(String(42), String(-0), String(0.1 + 0.2), String(1 / 0));
console.log(String(true), String(false));
console.log(String("already"), String(""));
console.log(String());

console.log(Boolean(1), Boolean(0), Boolean(-0), Boolean(0 / 0));
console.log(Boolean("x"), Boolean(""), Boolean(true), Boolean(false));
console.log(Boolean());

const arr = [1];
console.log(Boolean(arr));
interface B {
  v: number;
}
const rec: B = { v: 0 };
console.log(Boolean(rec));

// Boolean over a union: the arm's ToBoolean through the union helper.
function truthy(u: string | undefined): boolean {
  return Boolean(u);
}
console.log(truthy("s"), truthy(""), truthy(undefined));

console.log(Number(3.5), Number(-0) === 0, Number(true), Number(false));
console.log(Number());

// Results are ordinary values: they flow, concatenate, and compare.
const s = String(7) + "!";
const n = Number(true) + 2;
console.log(s, n, Boolean(s));
