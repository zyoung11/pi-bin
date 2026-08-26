// @exit: 1
// An UNCAUGHT shape mismatch: the AssertionError's Comparison diff
// travels the uncaught path — stdout keeps everything printed before
// the failure, the process exits 1 (stderr is the uncompared report).
import assert from "node:assert";

console.log("before");
assert.throws(() => { throw new RangeError("boom"); }, { name: "TypeError", message: "boom" });
console.log("never reached");
