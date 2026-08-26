// The NaN global (and its Number./Infinity siblings) is a non-finite
// numeric literal — IEEE-exact through arithmetic, comparisons, the
// number formatter (String(NaN) === "NaN"), template strings, JSON
// (null), array search (indexOf misses NaN, includes finds it — the
// SameValueZero vs strict-equality split), and Math's NaN poisoning.

console.log(NaN);
console.log(String(NaN));
console.log(`interp ${NaN}`);
console.log(NaN + 1, NaN * 0, 0 / 0 === 0 / 0);
console.log(Number.isNaN(NaN), Number.isFinite(NaN));
console.log(Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY);
console.log(JSON.stringify(NaN), JSON.stringify([NaN, 1]));
console.log([NaN].indexOf(NaN), [NaN].includes(NaN));
console.log(Math.max(NaN, 5), Math.min(NaN, 5));
console.log(isNaN(NaN));

// NaN never equals itself; the f64 compare is the IEEE compare.
const n: number = NaN;
console.log(n === n, n !== n, n < 1, n > 1);

// NaN through typed slots: variables, params, returns, array elements.
function passthru(x: number): number {
  return x;
}
console.log(passthru(NaN));
const arr = [1, NaN, 3];
console.log(arr.length, arr[1]);

// Sort with NaN present follows the comparator's own answers.
console.log([3, NaN, 1].map((x) => (Number.isNaN(x) ? "nan" : String(x))).join(","));
