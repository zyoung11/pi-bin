// The test/common mustCall shape, unmodified in spirit: an UNTYPED JS
// helper takes a function, wraps it in a counting closure, and hands the
// wrapper back. Everything here is implicit-any — the wrapper captures a
// dyn param and a number, and both the incoming fn and the outgoing
// wrapper cross the checked-dynamic function boundary.
"use strict";

let outstanding = 0;

function mustCall(fn, expected) {
  if (typeof fn !== "function") throw new TypeError("mustCall needs a function");
  const want = expected === undefined ? 1 : expected;
  let calls = 0;
  outstanding += 1;
  const wrapped = function (a, b, c) {
    calls += 1;
    if (calls === want) outstanding -= 1;
    return fn(a, b, c);
  };
  return wrapped;
}

function mustNotCall() {
  return function () {
    throw new Error("must not be called");
  };
}

function report() {
  return outstanding === 0 ? "all expected callbacks ran" : `outstanding: ${outstanding}`;
}

module.exports = { mustCall, mustNotCall, report };
