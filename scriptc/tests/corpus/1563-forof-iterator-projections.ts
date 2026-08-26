// for-of over `m.keys()` / `m.values()` / `m.entries()` consumed DIRECTLY
// by the loop head: the container's live walk with the projection applied —
// exactly `for..of m`. (Stored iterator objects stay fenced.)
const m = new Map<string, number>();
m.set("a", 1);
m.set("b", 2);
m.set("c", 3);
for (const k of m.keys()) console.log("k:", k);
for (const v of m.values()) console.log("v:", v);
for (const [k, v] of m.entries()) console.log("e:", k, v);
for (const e of m.entries()) console.log("t:", e[0], e[1]);

// Sets: keys() and values() are the elements; entries() yields [v, v].
const s = new Set<string>(["x", "y"]);
for (const v of s.keys()) console.log("sk:", v);
for (const v of s.values()) console.log("sv:", v);
for (const [a, b] of s.entries()) console.log("se:", a, b);

// The LIVE-iteration contract rides through the projection (JS's container
// iterators are live views): deletes are skipped, adds are visited.
const live = new Map<string, number>([
  ["p", 1],
  ["q", 2],
]);
for (const k of live.keys()) {
  if (k === "p") {
    live.delete("q");
    live.set("r", 3);
  }
  console.log("live:", k);
}

// break/continue leave exactly like JS; number keys and value projections
// compose with the usual SameValueZero key semantics.
for (const v of m.values()) {
  if (v === 2) continue;
  if (v === 3) break;
  console.log("bc:", v);
}
const nan = 0 / 0;
const nums = new Map<number, string>([
  [nan, "nan"],
  [-0, "zero"],
]);
for (const k of nums.keys()) console.log("nk:", k);
for (const v of nums.values()) console.log("nv:", v);

// The receiver expression evaluates once, computed receivers included.
let makes = 0;
function mk(): Map<string, number> {
  makes++;
  return new Map([["only", 7]]);
}
for (const [k, v] of mk().entries()) console.log("mk:", k, v);
console.log("makes:", makes);
console.log("done");
