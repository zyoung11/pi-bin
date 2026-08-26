// Closures and higher-order functions in JS: JSDoc types the parameters
// tsc cannot infer (function declarations); everything downstream is
// inference.
'use strict';

/** @param {number} start */
function makeCounter(start) {
  let n = start;
  return () => {
    n += 1;
    return n;
  };
}

const c1 = makeCounter(10);
const c2 = makeCounter(100);
c1();
c1();
console.log(c1(), c2());

/**
 * @param {string[]} items
 * @param {(s: string) => boolean} keep
 */
function partition(items, keep) {
  // Evolving-array inference can't see through the ternary alias (same in
  // TS) — the @type annotations pin string[].
  /** @type {string[]} */
  const yes = [];
  /** @type {string[]} */
  const no = [];
  for (const it of items) (keep(it) ? yes : no).push(it);
  return { yes, no };
}

const { yes, no } = partition(["one", "three", "five", "six"], (s) => s.length > 3);
console.log(yes.join("/"), "|", no.join("/"));

/** @param {number} factor */
function scaler(factor) {
  /** @param {number[]} xs */
  return function scale(xs) {
    return xs.map((x) => x * factor);
  };
}
console.log(scaler(3)([1, 2, 3]).join(","));
