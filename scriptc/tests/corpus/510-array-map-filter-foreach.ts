// map / filter / forEach with JS-exact semantics: callbacks run
// left-to-right, the length is read once up front (elements the callback
// appends are NOT visited), elements are read fresh each iteration.
const nums = [1, 2, 3, 4, 5];

const doubled = nums.map((x) => x * 2);
console.log(doubled.length, doubled[0], doubled[4]);

const strs = nums.map((x) => `n${x}`);
console.log(strs[0], strs[4]);

const evens = nums.filter((x) => x % 2 === 0);
console.log(evens.length, evens[0], evens[1]);

let sum = 0;
nums.forEach((x) => {
  sum += x;
});
console.log(sum);

// Type-changing map chains: number[] -> string[] -> boolean[].
const flags = nums.map((x) => `${x}`).map((s) => s.length > 0);
console.log(flags.length, flags[0]);

// Callback side effects run in order; capturing callbacks see live bindings.
let trace = "";
["a", "b", "c"].forEach((s) => {
  trace += s;
});
console.log(trace);

// Growth during iteration: JS caches the length, so pushes from the
// callback are not visited (identical here).
const grow = [1, 2, 3];
const visited = grow.map((x) => {
  grow.push(x * 10);
  return x;
});
console.log(visited.length, grow.length);

// filter on strings and booleans.
console.log(["", "keep", "", "also"].filter((s) => s.length > 0).length);
console.log([true, false, true].filter((b) => b).length);

// map over nested arrays (element type is itself an array).
const rows = [[1, 2], [3]];
const rowLens = rows.map((r) => r.length);
console.log(rowLens[0], rowLens[1]);

// Empty arrays: no callback invocations.
const empty: number[] = [];
console.log(empty.map((x) => x * 2).length, empty.filter((x) => x > 0).length);
empty.forEach((x) => console.log("never", x));

// map/filter results are ordinary arrays: mutable, reference-semantic.
const out = nums.filter((x) => x > 2);
out.push(99);
console.log(out.length, out[out.length - 1]);
