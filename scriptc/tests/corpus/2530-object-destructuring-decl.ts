// Object destructuring in declarations over statically-known record
// shapes: shorthand, renames, defaults (including a default referencing
// an EARLIER binding of the same pattern — JS's left-to-right rule),
// nesting, literal and foldable computed keys.
const obj = { a: 1, b: "two", c: true };
const { a, b } = obj;
const { a: renamed } = obj;
const { c: flag = false } = obj;
console.log(a, b, renamed, flag);

interface Opt {
  p?: number;
  q?: string;
}
const sparse: Opt = { q: "set" };
const { p = 42, q = "unset" } = sparse;
console.log(p, q);

// A later default may read an earlier binding (left-to-right).
const cfg: { tld?: string; host?: string } = {};
const { tld = "localhost", host = "www." + tld } = cfg;
console.log(tld, host);

// Nested patterns recurse through their own reads.
const nested = { inner: { u: 3, v: 4 }, s: 5 };
const { inner: { u, v }, s } = nested;
console.log(u, v, s);

// Literal and foldable computed keys resolve to static field names.
const keyed = { "space key": 1, 2: "two", plain: 3 };
const { "space key": spaced, 2: second, plain } = keyed;
console.log(spaced, second, plain);

const KEY = "plain" as const;
const { [KEY]: viaComputed } = keyed;
console.log(viaComputed);

// A default on a field with no undefined arm is dead code (never runs).
let evaluated = 0;
function sideEffect(): number {
  evaluated += 1;
  return -1;
}
const { a: whole = sideEffect() } = obj;
console.log(whole, evaluated);
