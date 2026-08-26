// Tuples are fixed-shape records: literal-index reads/writes with per-index
// types, .length as the arity constant, destructuring, tuples inside
// records, and tuple ARRAYS (the [string, string][] blocker family).
const pair: [string, number] = ["answer", 42];
console.log(pair[0], pair[1], pair.length);

// writes hit the position's own type
pair[1] = 43;
console.log(pair[1]);

// destructuring (holes skip positions, like JS)
const [name, value] = pair;
console.log(name, value);
const triple: [number, number, number] = [1, 2, 3];
const [, mid] = triple;
console.log(mid);

// nested destructuring: tuple inside a tuple
const nested: [string, [number, boolean]] = ["outer", [7, true]];
const [head, [seven, flag]] = nested;
console.log(head, seven, flag);

// tuples are reference values with identity
const alias = pair;
alias[0] = "renamed";
console.log(pair[0], alias === pair);

// heterogeneous positions: records inside tuples
interface Meta {
  tag: string;
}
const withRec: [Meta, number] = [{ tag: "m" }, 9];
console.log(withRec[0].tag, withRec[1]);
withRec[0].tag = "mutated";
console.log(withRec[0].tag);

// tuple ARRAYS: push, for-of, index chains, identity
const kv: [string, string][] = [
  ["host", "localhost"],
  ["port", "8080"],
];
kv.push(["proto", "https"]);
for (const entry of kv) {
  console.log(entry[0], "=", entry[1]);
}
console.log(kv.length, kv[2][1], kv.indexOf(kv[1]));

// destructuring the elements in a loop body
for (const e of kv) {
  const [k, v] = e;
  console.log(`${k}:${v}`);
}

// ...and directly in the loop variable (the real-CLI pattern)
for (const [k, v] of kv) {
  console.log(`${k}=${v}`);
}
let joined = "";
for (const [k] of kv) {
  joined += k;
}
console.log(joined);

// tuples as record fields
interface Span {
  range: [number, number];
  label: string;
}
const spans: Span[] = [
  { range: [0, 4], label: "head" },
  { range: [5, 9], label: "tail" },
];
for (const s of spans) {
  console.log(s.label, s.range[0], s.range[1]);
}

// tuples returned from functions (and .length off a const binding)
function bounds(xs: number[]): [number, number] {
  let lo = xs[0];
  let hi = xs[0];
  for (const x of xs) {
    if (x < lo) lo = x;
    if (x > hi) hi = x;
  }
  return [lo, hi];
}
const b = bounds([3, 1, 4, 1, 5]);
console.log(b[0], b[1], b.length);
