// reduce / reduceRight, both declared forms. With an initial value the
// walk covers every element; without one the first (or last) element seeds
// the accumulator and an empty receiver throws Node's exact TypeError.
const nums = [1, 2, 3, 4];

// With an initial value.
console.log(nums.reduce((acc, x) => acc + x, 0));
console.log(nums.reduce((acc, x) => acc * x, 1));
console.log(nums.reduceRight((acc, x) => acc + x, 100));

// Order sensitivity: string accumulation shows the walk direction.
const letters = ["a", "b", "c"];
console.log(letters.reduce((acc, s) => acc + s, ">"));
console.log(letters.reduceRight((acc, s) => acc + s, "<"));

// Type-changing reduce: number elements into a string accumulator.
console.log(nums.reduce((acc, x) => `${acc}[${x}]`, ""));

// Without an initial value: the seed is a[0] / a[n-1] and the callback
// runs n-1 times.
console.log(nums.reduce((acc, x) => acc + x));
console.log(nums.reduceRight((acc, x) => acc - x));
let seedCalls = 0;
console.log(
  [7].reduce((acc, x) => {
    seedCalls += 1;
    return acc + x;
  }),
);
console.log("seedCalls", seedCalls);

// Index and array parameters after (acc, element).
console.log(nums.reduce((acc, x, i) => acc + x * i, 0));
console.log(nums.reduce((acc, _x, i, arr) => acc + arr.length + i, 0));
console.log(nums.reduceRight((acc, _x, i) => `${acc}${i}`, "idx:"));

// Record elements: summing a field, and array-of-array elements (the
// grouped-rows pattern).
const items = [
  { name: "a", n: 2 },
  { name: "b", n: 5 },
];
console.log(items.reduce((acc, it) => acc + it.n, 0));
const groups = [[1, 2], [3], [4, 5, 6]];
console.log(groups.reduce((s, g) => s + g.length, 0));

// Empty array with an initial value: the callback never runs.
const empty: number[] = [];
console.log(empty.reduce((acc, x) => acc + x, 42));

// Empty array without one: Node's exact TypeError.
try {
  empty.reduce((acc, x) => acc + x);
} catch (e) {
  if (e instanceof TypeError) console.log(`${e.name}: ${e.message}`);
}
try {
  empty.reduceRight((acc, x) => acc + x);
} catch (e) {
  if (e instanceof TypeError) console.log(`${e.name}: ${e.message}`);
}

// The length is read once up front; elements are read fresh each pass.
const grow = [1, 2, 3];
console.log(
  grow.reduce((acc, x) => {
    grow.push(x * 10);
    return acc + x;
  }, 0),
  grow.length,
);
