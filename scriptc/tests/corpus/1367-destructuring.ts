// Destructuring declarations — sugar over indexed/field reads: the
// initializer evaluates ONCE, each name binds from a read of the temp,
// nested patterns recurse. Array patterns read indices in order; object
// patterns read fields (aliases via `prop: name`); holes skip positions.

const nums = [10, 20, 30];
const [a, b] = nums;
console.log(a, b);

const [, second, third] = nums;
console.log(second, third);

interface Point {
  x: number;
  y: number;
  label: string;
}
const p: Point = { x: 1, y: 2, label: "origin-ish" };
const { x, y } = p;
console.log(x, y);

// Aliases: the FIELD is x, the binding is renamed.
const { x: px, label: name } = p;
console.log(px, name);

// The initializer evaluates exactly once.
let calls = 0;
function makePair(): number[] {
  calls++;
  return [7, 8];
}
const [u, v] = makePair();
console.log(u, v, calls);

// Nested patterns: records in records, arrays in records.
interface Wrap {
  inner: Point;
  tags: string[];
}
const w: Wrap = { inner: { x: 5, y: 6, label: "in" }, tags: ["t1", "t2"] };
const {
  inner: { x: ix, label: il },
  tags: [firstTag],
} = w;
console.log(ix, il, firstTag);

// let-destructured bindings stay assignable.
const mSrc: number[] = [100];
let [m] = mSrc;
m = m + 1;
console.log(m);

// Optional fields destructure as their union and narrow as usual.
interface Opts {
  quiet?: boolean;
  out: string;
}
const o: Opts = { out: "file.txt" };
const { quiet, out } = o;
console.log(quiet === undefined, out);

// File-scope destructured bindings are module globals: functions see them.
const gSrc: string[] = ["ga", "gb"];
const [gA, gB] = gSrc;
function readsGlobals(): string {
  return gA + "/" + gB;
}
console.log(readsGlobals());

// Reference semantics ride through: a destructured record field aliases.
interface Holder {
  pt: Point;
}
const h: Holder = { pt: { x: 0, y: 0, label: "moves" } };
const { pt } = h;
pt.x = 42;
console.log(h.pt.x);

// Multi-declarator statements mix patterns and plain names.
const qSrc: number[] = [9];
const [q] = qSrc, plain = q + 1;
console.log(q, plain);
