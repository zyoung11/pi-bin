// Readonly-modifier flows are FREE: readonly is a checker-only view, not
// part of a shape's interned identity, so `T` into `Readonly<T>` (and
// readonly array/tuple slots) is the same value with no reshape at all.
type P = { x: number; y: number };
const p: P = { x: 1, y: 2 };
const rp: Readonly<P> = p;
console.log(rp.x + rp.y);

const xs: number[] = [1, 2, 3];
const rxs: readonly number[] = xs;
console.log(rxs.length, rxs[0]);
const ra: ReadonlyArray<string> = ["a", "b"];
console.log(ra.join("-"));

const t: [string, number] = ["k", 9];
const rt: readonly [string, number] = t;
console.log(rt[0], rt[1]);

// Readonly slots in parameters and returns.
function sum(nums: readonly number[]): number {
  let s = 0;
  for (const n of nums) s += n;
  return s;
}
console.log(sum(xs));
function frozenPoint(): Readonly<P> {
  return p;
}
console.log(JSON.stringify(frozenPoint()));

// Readonly composes with genuine width: a wide record into a Readonly
// subset still copies the subset.
type Wide = { x: number; y: number; z: number };
const w3: Wide = { x: 3, y: 4, z: 5 };
const rw: Readonly<{ x: number; y: number }> = w3;
console.log(rw.x, rw.y);
