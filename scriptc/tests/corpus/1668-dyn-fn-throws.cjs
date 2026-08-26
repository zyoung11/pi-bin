// @exit: 1
// Exceptions PROPAGATE through the checked-dynamic function boundary:
// a typed function that throws, called through its dyn box (directly and
// through an untyped wrapper), unwinds into the caller catchably — and
// state captured through the boundary survives the unwind. The last call
// escapes uncaught (stdout compared, exit 1 both lanes).
"use strict";

function boom(n) {
  if (n > 2) throw new RangeError(`too big: ${n}`);
  return n * 10;
}

function wrap(fn) {
  let calls = 0;
  return function (x) {
    calls += 1;
    console.log(`call ${calls}`);
    return fn(x);
  };
}

const wrapped = wrap(boom);
console.log(`${wrapped(1)}`);
console.log(`${wrapped(2)}`);
try {
  wrapped(3);
} catch (e) {
  if (e instanceof RangeError) console.log("caught: " + e.message);
}
// The counter kept counting through the throw.
console.log(`${wrapped(0)}`);

console.log("one more, uncaught");
wrapped(9);
console.log("never reached");
