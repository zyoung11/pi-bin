// The JS INFERENCE-GAP fixture: noImplicitAny is off (this directory's
// tsconfig), so the untyped parameter types `any` — landing exactly where
// `any` lands in TS: SC2011 (runs with --dynamic) in a static analysis,
// compiled-dynamically under --dynamic. JSDoc-typed code right next to it
// stays fully static.
'use strict';

function untyped(x) {
  return x * 2;
}

/** @param {number} n */
function typed(n) {
  return n * 3;
}

console.log(`${untyped(21)}`);
console.log(typed(14));
