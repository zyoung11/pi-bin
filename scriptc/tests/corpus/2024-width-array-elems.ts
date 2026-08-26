// ARRAY element widening: an array flows into a slot whose element type
// is a union the source's elements lift into — the per-element copy loop
// (SEMANTICS.md 36's stance applied to arrays: the result is a fresh
// array). Read-after-narrow flows only.
const nums: number[] = [1, 2, 3];
const maybe: (number | undefined)[] = nums;
let sum = 0;
for (const m of maybe) sum += m === undefined ? 0 : m;
console.log(sum, maybe.length);

const names: string[] = ["a", "b"];
const nullable: (string | null)[] = names;
const out: string[] = [];
for (const s of nullable) out.push(s === null ? "-" : s);
console.log(out.join(","));

// A union-element array re-tags per element into a wider union.
function pick(flag: boolean): (string | undefined)[] {
  return flag ? ["x", undefined] : [];
}
const wide: (string | number | undefined)[] = pick(true);
const shown: string[] = [];
for (const v of wide) {
  if (typeof v === "string") shown.push(v);
  else if (v === undefined) shown.push("u");
}
console.log(shown.join(""));

// Nested arrays: the element pair is itself an array that lifts.
type Full = { id: string; n: number };
const grid: Full[][] = [[{ id: "a", n: 1 }], [{ id: "b", n: 2 }, { id: "c", n: 3 }]];
const slim: { id: string }[][] = grid;
const flat: string[] = [];
for (const row of slim) for (const cell of row) flat.push(cell.id);
console.log(flat.join(","));

// Call-argument and return flows, plus empty arrays (guarded reads —
// an out-of-bounds index traps, divergence 4).
function firstOr(xs: (number | undefined)[], d: number): number {
  if (xs.length === 0) return d;
  const h = xs[0];
  return h === undefined ? d : h;
}
console.log(firstOr(nums, -1), firstOr([], -1));
function widen(): (number | undefined)[] {
  return nums;
}
console.log(widen().length);
