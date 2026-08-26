// The checked-dynamic FUNCTION boundary, IN direction: a typed closure
// passed to an untyped JS helper (the implicit-any param is a dyn slot)
// boxes as the checked-dynamic tree's callable kind — identity and callability preserved.
// Calls through the box validate each argument against the closure's
// declared signature and convert the result back; JS arity semantics
// hold (extra arguments ignored, missing arguments are undefined).
// Node is the oracle byte-for-byte.
"use strict";
const { inspect } = require("node:util");

function add(a, b) {
  return a + b;
}

// An untyped identity helper: fn crosses INTO the dyn slot and back OUT.
function pass(v) {
  return v;
}
const back = pass(add);
console.log(`${back(2, 3)}`);

// Calling through a helper that calls the dyn value itself.
function callWith(fn, x, y) {
  return fn(x, y);
}
console.log(`${callWith(add, 10, 20)}`);

// The typeof guard test/common's mustCall performs, both forms.
function requireFn(fn) {
  if (typeof fn !== "function") throw new TypeError("not a function");
  return "guarded " + typeof fn;
}
console.log(requireFn(add));
try {
  requireFn("nope");
} catch (e) {
  if (e instanceof TypeError) console.log("caught: " + e.message);
}

// JS arity through the boundary: extras ignored, missing = undefined.
function pair(a, b) {
  return `${a},${b}`;
}
function callThree(fn, x, y, z) {
  return fn(x, y, z);
}
function callOne(fn, x) {
  return fn(x);
}
console.log(`${callThree(pair, 1, 2, 3)}`);
console.log(`${callOne(pair, 1)}`);

// Boxed functions are truthy and answer "function" to bare typeof.
function pick(v) {
  return v ? "truthy" : "falsy";
}
console.log(pick(add));
function kindOf(v) {
  return typeof v;
}
console.log(kindOf(add), kindOf(1), kindOf("s"), kindOf(null));

// inspect renders Node's function form, named and anonymous.
console.log(inspect(pass(add)));
console.log(inspect(pass(function named() { return 1; })));
console.log(inspect(pass(function (x) { return x; })));
