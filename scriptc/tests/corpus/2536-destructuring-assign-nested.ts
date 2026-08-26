// NESTED patterns in destructuring assignment to existing bindings:
// object-in-object, array-in-array, and mixed nesting — each level
// destructures its element's value through its own hidden temp.
const src = { p: { q: 1, r: 2 }, s: 3 };
let q = 0;
let r = 0;
let s = 0;
({ p: { q, r }, s } = src);
console.log(q, r, s);

// Deep nesting.
const deep = { o: { i: { v: 5, w: 6 } } };
let v = 0;
let w = 0;
({ o: { i: { v, w } } } = deep);
console.log(v, w);

// Arrays inside arrays (tuple sources type each level).
let a = 0;
let b = 0;
let c = 0;
[a, [b, c]] = [1, [2, 3]] as [number, [number, number]];
console.log(a, b, c);

// Records inside arrays and arrays inside records.
let x = 0;
let y = 0;
[{ x }, { x: y }] = [{ x: 7 }, { x: 8 }] as [{ x: number }, { x: number }];
console.log(x, y);

const holder = { list: [10, 11] as [number, number], name: "h" };
let n0 = 0;
let n1 = 0;
let name = "";
({ list: [n0, n1], name } = holder);
console.log(n0, n1, name);

// Nested rest: the sole-leading-rest unwrap consumes like the inner
// pattern alone.
let h0 = 0;
let h1 = 0;
const packed = [21, 22, 23];
[...[h0, h1]] = packed;
console.log(h0, h1);

// Nested defaults INSIDE the inner pattern still apply.
const partial: { pt: { u?: number } } = { pt: {} };
let u = -1;
({ pt: { u = 40 } } = partial);
console.log(u);
