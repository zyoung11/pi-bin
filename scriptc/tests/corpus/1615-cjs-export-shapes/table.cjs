// The tmpdir.js shape: a module.exports table with accessor entries over
// mutable module state — every read runs the getter (Node's semantics),
// so mutations through the exported setter are visible per read.
'use strict';
let current = 'first';
function bump(v) { current = v; }
module.exports = {
  bump,
  get value() { return current; },
  set value(v) { current = v; },
};
