// The canonical Node-suite shape end-to-end: test/common's mustCall — an
// untyped helper wraps a typed function in a counting closure, and the
// wrapper flows to callback positions (setTimeout, direct calls) and
// back out. Closures capture state (the count, the wrapped fn) THROUGH
// the checked-dynamic boundary. Node is the oracle byte-for-byte.
"use strict";
const { mustCall, mustNotCall, report } = require("./common.cjs");

function onDone(code, signal) {
  console.log(`done code=${code} signal=${signal}`);
  return code;
}

// The wrapper keeps the wrapped function's behavior and identity of
// effect: calls count, args pass through, results come back.
const wrapped = mustCall(onDone, 2);
console.log(`${wrapped(0, "none")}`);
console.log(`${wrapped(1)}`); // missing arg -> undefined, like JS
console.log(report());

// Callback position: the dyn wrapper adapts into setTimeout's slot.
let ticked = mustCall(function tick() {
  console.log("tick");
  console.log(report());
});
setTimeout(ticked, 0);

// mustNotCall hands back a thrower; calling it is the failure mode.
const never = mustNotCall();
try {
  never();
} catch (e) {
  if (e instanceof Error) console.log("caught: " + e.message);
}

// The guard arm: a non-function argument is rejected up front.
try {
  mustCall(42);
} catch (e) {
  if (e instanceof TypeError) console.log("caught: " + e.message);
}

console.log("main done");
