// Math.max/Math.min are VARIADIC: any plain arity lowers statically as the
// left fold of the two-arg scalar compare — zero args answer the fold's
// seed (-Infinity/+Infinity), one arg answers itself (NaN included; every
// argument is number-typed so ToNumber is the identity), and NaN poisons /
// ±0 orders by the JS rules through every fold step. Arguments still
// evaluate left to right. The one-spread form keeps its array fold.
console.log(Math.max(1, 9, 4), Math.min(3, 1, 2, -8));
console.log(Math.max(), Math.min());
console.log(Math.max(5), Math.min(-7));
console.log(Math.max(1, NaN, 3), Math.min(NaN, 2));
console.log(Math.min(-0, 0), 1 / Math.min(-0, 0));
console.log(Math.max(0, -0), 1 / Math.max(0, -0));
console.log(Math.max(2, 8, -1, 6, 8, 0), Math.min(2, 8, -1, 6, 8, 0));

// Union-typed (literal-union) arguments are still number-typed arguments.
const u: 1 | 5 | 9 = 5;
console.log(Math.max(u, 2, u), Math.min(u, 7, 3));

// Left-to-right evaluation order of the argument expressions.
const seen: number[] = [];
function tap(x: number): number {
  seen.push(x);
  return x;
}
console.log(Math.max(tap(3), tap(1), tap(2)));
console.log(seen.join(","));

// The spread fold is unchanged beside the n-ary form.
const xs: number[] = [4, 7, 2];
console.log(Math.max(...xs), Math.min(...xs));
const empty: number[] = [];
console.log(Math.max(...empty), Math.min(...empty));
