// indexOf (strict equality: NaN NEVER matches) vs includes (SameValueZero:
// NaN DOES match) — plus -0/0, strings by content, arrays by reference.
const nan = 0 / 0;

const withNan = [1, nan, 3];
console.log(withNan.indexOf(nan), withNan.includes(nan)); // -1 true
console.log(withNan.indexOf(3), withNan.includes(2)); // 2 false

// -0 and 0 are equal under both strict equality and SameValueZero.
console.log([-0].indexOf(0), [0].indexOf(-0), [-0].includes(0)); // 0 0 true

// First match wins; misses are -1/false.
console.log([5, 7, 5].indexOf(5), [5].indexOf(6), [5].includes(5), [5].includes(6));

// Strings compare by content (JS strings are primitive values).
const words = ["alpha", "beta", "alpha"];
console.log(words.indexOf("alpha"), words.indexOf("al" + "pha"), words.includes("gamma"));

// Booleans.
console.log([false, true].indexOf(true), [false].includes(true));

// Nested arrays compare by REFERENCE identity, not structure.
const inner = [1, 2];
const outer = [inner, [1, 2]];
console.log(outer.indexOf(inner), outer.indexOf([1, 2]), outer.includes(inner)); // 0 -1 true

// Empty arrays.
const empty: number[] = [];
console.log(empty.indexOf(1), empty.includes(1)); // -1 false

// Results feed straight into arithmetic and conditions.
if (words.includes("beta")) {
  console.log("beta at", words.indexOf("beta"));
}
