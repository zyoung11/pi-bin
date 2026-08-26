// The mustCall HAPPY path against the shape-exact common replica: every
// registration is satisfied, the wrapper forwards arguments and results
// through fn.apply(this, arguments), name/length ride defineProperties,
// and the exit-time check passes silently (exit 0) — Node byte-exact.
'use strict';
const common = require('./common.cjs');

const twice = common.mustCall(function onTwice(a, b) {
  console.log('onTwice', a, b);
  return a; // arithmetic over a missing arg is the loud-divergence stance
}, 2);
console.log('first', twice(1, 2));
console.log('short', twice(5));

console.log('name', twice.name, 'length', twice.length);

const atLeast = common.mustCallAtLeast(function counted() {
  console.log('counted ran');
}, 2);
atLeast();
atLeast();
atLeast();

// Bare mustCall(): the noop wrapper still counts.
const bare = common.mustCall();
bare();

// The number-first spelling: mustCall(3) === mustCall(noop, 3).
const three = common.mustCall(3);
three();
three();
three();

// mustSucceed: the (err, ...args) rest shape over apply.
const ok = common.mustSucceed(function onOk(v, w) {
  console.log('ok', v, w);
  return v;
}, 1);
console.log('succeeded', ok(null, 'value', 42));

// mustNotCall hands back a thrower; calling it is the failure mode.
const never = common.mustNotCall('boom');
try {
  never('x', 7);
} catch (e) {
  console.log('caught:', e instanceof Error ? e.message : 'not-an-error');
}

console.log('main done');
