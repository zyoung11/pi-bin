// Math.max/min over ONE spread number[]: the static JS fold — any NaN
// poisons the result, the empty array gives the zero-arg constants, and
// the ±0 preferences match JS (max prefers +0, min prefers -0).
const xs = [3, 9, 4, 7];
console.log(Math.max(...xs));
console.log(Math.min(...xs));
const one = [42];
console.log(Math.max(...one));
console.log(Math.min(...one));
const empty: number[] = [];
console.log(Math.max(...empty));
console.log(Math.min(...empty));
const withNaN = [1, 0 / 0, 2]; // NaN spelled arithmetically (no NaN literal)
console.log(Math.max(...withNaN));
console.log(Math.min(...withNaN));
const zeros = [-0, 0];
console.log(1 / Math.max(...zeros));
console.log(1 / Math.min(...zeros));
const negs = [-5.5, -2.25, -9];
console.log(Math.max(...negs));
console.log(Math.min(...negs));
// The real-CLI table pattern: widths from mapped tuple labels.
const rows: [string, string][] = [
  ["Input", "$3"],
  ["Cache write", "$3.75"],
];
console.log(Math.max(...rows.map(([label]) => label.length)));
