// The es2022/es2023 relative and backwards array reads: `.at(i)` desugars
// to an interned ToIntegerOrInfinity-exact helper (truncate toward zero,
// NaN → 0, negatives wrap once by the length, still-out-of-range answers
// the undefined arm — never a bounds throw), and `.findLast(f)` /
// `.findLastIndex(f)` are the find pair's loop walked backwards
// (`i = n - 1; i >= 0; i--`), the spec's descending index walk.

const xs = [10, 20, 30];

// In-range, negative wrap, and both out-of-range directions.
console.log(xs.at(0) ?? -1, xs.at(2) ?? -1, xs.at(-1) ?? -1, xs.at(-3) ?? -1);
console.log(xs.at(3) ?? -1, xs.at(-4) ?? -1);

// ToIntegerOrInfinity: fractions truncate toward zero on BOTH signs
// (at(-1.5) is at(-1)), NaN reads index 0, ±Infinity is out of range.
console.log(xs.at(1.9) ?? -1, xs.at(-1.5) ?? -1);
console.log(xs.at(0 / 0) ?? -1, xs.at(1 / 0) ?? -1, xs.at(-1 / 0) ?? -1);

// String elements take the same union machinery.
const ss = ["alpha", "beta"];
console.log(ss.at(-2) ?? "none", ss.at(5) ?? "none");

// A runtime-computed index goes through the same helper.
let k = 2;
console.log(xs.at(k - 3) ?? -1);

// findLast/findLastIndex: last match wins, misses answer undefined / -1.
console.log([1, 2, 3, 4, 5].findLast((x) => x % 2 === 1) ?? -1);
console.log([1, 2, 3, 4].findLastIndex((x) => x < 3));
console.log([1, 2, 3].findLast((x) => x > 10) ?? -99);
console.log([1, 2, 3].findLastIndex((x) => x > 10));

// The (element, index) callback arity sees descending indexes.
const words = ["one", "two", "three"];
console.log(words.findLast((w, i) => i < 2 && w.length === 3) ?? "none");
const order: number[] = [];
words.findLastIndex((w, i) => {
  order.push(i);
  return false;
});
console.log(order.join(","));
