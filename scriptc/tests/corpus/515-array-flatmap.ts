// flatMap: map plus a one-level flatten. Array-returning callbacks append
// the returned array's elements in order; empty returns contribute
// nothing; a non-array callback result is pushed as-is (which is map).
const nums = [1, 2, 3];

// Basic expansion: each element yields two.
const doubled = nums.flatMap((x) => [x, x * 10]);
console.log(doubled.length, doubled.join(","));

// Filtering with an empty return arm requires an annotation to keep the
// arm types identical (the ternary's [] adopts the sibling's array type).
const evensOnly = nums.flatMap((x): number[] => (x % 2 === 0 ? [x] : []));
console.log(evensOnly.length, evensOnly.join(","));

// Strings, and index/array parameters.
const words = ["ab", "c"];
const chars = words.flatMap((w) => {
  const out: string[] = [];
  for (let i = 0; i < w.length; i++) out.push(w.charAt(i));
  return out;
});
console.log(chars.length, chars.join("|"));
const tagged = nums.flatMap((x, i) => [`${i}:${x}`]);
console.log(tagged.join(","));
const withArr = nums.flatMap((x, _i, arr) => [x, arr.length]);
console.log(withArr.join(","));

// One-level only: returning arrays of arrays keeps the inner arrays.
const nested = nums.flatMap((x) => [[x], [x * 2]]);
console.log(nested.length, nested[0]![0], nested[5]![0]);

// Non-array callback: flatMap behaves exactly like map.
const asMap = nums.flatMap((x) => x * 3);
console.log(asMap.length, asMap.join(","));

// Record elements in, record elements out.
const jobs = [
  { model: "m1", count: 2 },
  { model: "m2", count: 1 },
];
const expanded = jobs.flatMap((j) => {
  const out: { model: string; index: number }[] = [];
  for (let i = 0; i < j.count; i++) out.push({ model: j.model, index: i });
  return out;
});
console.log(expanded.length);
for (const e of expanded) console.log(e.model, e.index);

// The length is read once: elements appended by the callback are not
// visited (JS caches the length up front).
const grow = [1, 2];
const visited = grow.flatMap((x) => {
  grow.push(x * 100);
  return [x];
});
console.log(visited.length, grow.length);

// Empty receivers produce empty results.
const empty: number[] = [];
console.log(empty.flatMap((x) => [x, x]).length);
