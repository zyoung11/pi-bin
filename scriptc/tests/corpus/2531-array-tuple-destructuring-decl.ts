// Array and tuple destructuring in declarations: holes, defaults (with
// the bounds test JS's past-the-end undefined demands), rest packing a
// fresh tail, tuple positions as field reads, nested patterns.
const arr = [10, 20, 30];
const [e0, e1] = arr;
const [, , e2] = arr;
console.log(e0, e1, e2);

// Defaults fire past the end and on in-bounds undefined — never on null.
const short: number[] = [7];
const [f0 = -1, f1 = -2, f2 = -3] = short;
console.log(f0, f1, f2);

const withUndef: (number | undefined)[] = [undefined, 5];
const [g0 = 100, g1 = 200] = withUndef;
console.log(g0, g1);

// Rest packs a FRESH tail copy: mutating it never reaches the source.
const [head, ...tail] = arr;
tail[0] = 999;
console.log(head, tail.join(","), arr.join(","));

// Tuples: positional field reads, defaults, rest tails.
const tup: [number, string, boolean] = [1, "s", true];
const [t0, t1, t2] = tup;
console.log(t0, t1, t2);

const pair: [number, string] = [8, "y"];
const [p0, ...pRest] = pair;
console.log(p0, pRest[0]);

// Nested array patterns recurse.
const grid: [number, [number, number]] = [1, [2, 3]];
const [g, [x1, y1]] = grid;
console.log(g, x1, y1);

// Mixed nesting: records inside tuples inside arrays.
const rows: [string, { n: number }][] = [["a", { n: 1 }], ["b", { n: 2 }]];
const [[label0, { n: n0 }], [label1, { n: n1 }]] = rows;
console.log(label0, n0, label1, n1);

// Empty patterns are pure no-ops past the source's own evaluation.
const [] = arr;
const {} = tup;
console.log("done");
