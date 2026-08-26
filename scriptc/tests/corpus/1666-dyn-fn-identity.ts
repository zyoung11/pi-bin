// The checked-dynamic function boundary from TypeScript: a typed closure
// stored in an `unknown` slot boxes (dynFrom); a checked cast back to the
// IDENTICAL signature unwraps the very same closure (identity preserved —
// `===` answers true); a cast to a DIFFERENT-but-adaptable signature
// wraps in a per-target shim that validates arguments and results. This
// file exercises VALID casts only — under Node `as` is a no-op and
// behavior is identical, so the differential harness applies (mismatch
// throws are covered scriptc-only in tests/harness/dyncheck.test.ts,
// exactly the JSON dynCheck split).

function add(a: number, b: number): number {
  return a + b;
}

// IN: boxing through an unknown local.
const u: unknown = add;

// OUT, identical signature: the exact-unwrap fast path.
const back = u as (a: number, b: number) => number;
console.log(back(2, 3));
console.log(back === add);

// OUT, adaptable signature (unknown result): the shim path — arguments
// convert in, the result stays dynamic and validates per use.
const loose = u as (a: number, b: number) => unknown;
const r = loose(4, 5);
console.log(typeof r === "number");
console.log(r as number);

// Closures with captured state cross too: the counter lives in the
// closure, the boundary preserves it.
function makeCounter(): () => number {
  let n = 0;
  return () => {
    n += 1;
    return n;
  };
}
const boxed: unknown = makeCounter();
const counter = boxed as () => number;
console.log(counter(), counter(), counter());

// A function RESULT crossing back out of the box: adapters validate the
// returned value into the target type.
function twice(x: number): number {
  return x * 2;
}
const t: unknown = twice;
const viaDyn = t as (x: number) => unknown;
console.log((viaDyn(21) as number) === 42);
