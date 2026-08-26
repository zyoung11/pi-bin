// Checked-dynamic values crossing into BUILTIN argument slots — the
// lib-boundary chokepoint (lib-boundary.ts). In a JS file an untyped
// pass-through's result is checked-dynamic ('any' → dyn), and every
// builtin-call slot it reaches gets the validated dynCheck coercion: a dyn
// holding the slot's type passes and the call runs with Node's exact
// semantics; nothing here ICEs or emits invalid C. (A dyn holding the
// WRONG type throws the checked-cast TypeError where Node would coerce —
// the documented checked-dynamic divergence — so only right-typed values
// appear in this differential program.)
'use strict';

function pass(v) { return v; }

const s = 'differential';
// strIntrinsic slots: slice's f64 args, repeat's count, indexOf's needle.
console.log('S1', s.slice(0, pass(6)));
console.log('S2', s.slice(pass(3), pass(8)));
console.log('S3', s.repeat(pass(2)).length);
console.log('S4', s.indexOf(pass('ent')));
console.log('S5', s.padStart(pass(14), pass('_')));

// regexIntrinsic slots: test's string argument.
console.log('R1', /^dif/.test(pass(s)));
console.log('R2', /xyz/.test(pass('abc')));

// libCall slots: setTimeout's ms through a checked-dynamic pass-through
// (the suite harness's platformTimeout shape) — the timer fires exactly
// like Node's.
setTimeout(() => {
  console.log('T1 fired');
}, pass(10));
