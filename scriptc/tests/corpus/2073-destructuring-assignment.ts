// Destructuring ASSIGNMENT to existing bindings — array patterns over
// tuples and arrays (defaults, elisions, a sole leading rest with a
// nested pattern), object patterns over records, empty patterns, and the
// EXPRESSION form (the assignment's value is the RHS value).

let a = "", b = 0;
const tuple: [string, number] = ["hi", 7];
[a, b] = tuple;
console.log(a, b);
[...[a, b = 0]] = tuple;
console.log(a, b);
let x = 0, y = 0, z = 0;
const nums = [1, 2, 3];
[x, , z] = nums;
console.log(x, z);
const arr = [10, 20];
[x, y] = arr;
console.log(x, y);
// expression value: the RHS
const v = ([x] = [42]);
console.log(v[0], x);
// arrow-body expression form
const inc = () => [x] = [x + 1];
console.log(inc()[0], x);
// empty patterns over static sources
({} = tuple);
[] = arr;
var w = [] = [1].map((n) => n + 1);
console.log(w[0]);
// chained through object pattern
let p = 0, q = 0;
const src = { p: 3, q: 4 };
const got = ({ p, q } = src);
console.log(p, q, got === src);
