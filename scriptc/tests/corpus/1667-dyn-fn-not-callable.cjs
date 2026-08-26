// @exit: 1
// Calling non-function dyn values: Node's exact catchable TypeError
// ("<name> is not a function"), for the identifier and member spellings —
// then the uncaught form at exit (stdout compared, exit 1 both lanes;
// stderr is the documented uncaught-report divergence).
"use strict";

function pass(v) {
  return v;
}

const num = pass(42);
try {
  num(1);
} catch (e) {
  if (e instanceof TypeError) console.log("caught: " + e.message);
}

const obj = pass({});
obj.n = 7;
try {
  obj.missing();
} catch (e) {
  if (e instanceof TypeError) console.log("caught: " + e.message);
}
try {
  obj.n();
} catch (e) {
  if (e instanceof TypeError) console.log("caught: " + e.message);
}

// Writes to nullish receivers throw Node's message too.
const nothing = pass(null);
try {
  nothing.k = 1;
} catch (e) {
  if (e instanceof TypeError) console.log("caught: " + e.message);
}

console.log("before the uncaught one");
const s = pass("text");
s();
console.log("never reached");
