// Destructuring ASSIGNMENT to existing bindings: object shorthand and
// renames, array positions, swaps, defaults, rest, empty patterns, and
// the assignment-expression VALUE (the RHS, enabling chains).
const src = { a: 1, b: 2, c: 3 };
let a = 0;
let b = 0;
({ a, b } = src);
console.log(a, b);

let renamed = 0;
({ c: renamed } = src);
console.log(renamed);

let m = 1;
let n = 2;
[m, n] = [n, m];
console.log(m, n);

const nums = [10, 20, 30, 40];
let first = 0;
let rest: number[] = [];
[first, ...rest] = nums;
console.log(first, rest.join(","));

// Defaults in assignment position — undefined fires them, values don't.
const opt: { p?: number; q?: number } = { q: 5 };
let p = -1;
let q = -1;
({ p = 77, q = 88 } = opt);
console.log(p, q);

// Array defaults carry the bounds test.
let d0 = 0;
let d1 = 0;
const bounds: number[] = [9];
[d0 = -1, d1 = -2] = bounds;
console.log(d0, d1);

// Object rest in assignment position.
let restObj: { b: number; c: number } = { b: 0, c: 0 };
({ a, ...restObj } = src);
console.log(a, JSON.stringify(restObj));

// The assignment expression's VALUE is the RHS: chains and reads work.
let x = 0;
let y = 0;
const source: { a: number; b: number } = { a: 6, b: 7 };
const out = ({ a: x } = { b: y } = source);
console.log(x, y, out.a + out.b);

// Empty patterns validate and nothing else.
({} = src);
[] = nums;
console.log("done");
