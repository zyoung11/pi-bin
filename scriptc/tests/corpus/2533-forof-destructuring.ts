// Destructuring in for-of heads: Map entries, arrays of records, arrays
// of tuples, defaults and rest in the head, and EXISTING bindings as
// the head (the assignment form).
const m = new Map<string, number>([["one", 1], ["two", 2]]);
for (const [k, v] of m) console.log(k, v);

const list = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
for (const { x, y } of list) console.log(x + y);

const pairs: [number, string][] = [[1, "a"], [2, "b"]];
for (const [n, s] of pairs) console.log(n, s);

// Defaults and rest inside a for-of head.
const sparse: { w?: number }[] = [{}, { w: 5 }];
for (const { w = -1 } of sparse) console.log(w);

const seqs: number[][] = [[1, 2, 3], [4]];
for (const [first, ...more] of seqs) console.log(first, more.length);

// Renames and nesting in the head.
for (const { x: left, y: right } of list) console.log(left, right);
const wrapped = [{ p: { q: 9 } }, { p: { q: 10 } }];
for (const { p: { q } } of wrapped) console.log(q);

// EXISTING bindings as the for-of head (assignment destructuring).
let key = "";
let val = 0;
for ([key, val] of m) console.log(key, val);
let acc = 0;
let cur = 0;
for ({ x: cur } of list) acc += cur;
console.log(acc, key, val);
