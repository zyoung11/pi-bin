// @exit: 1
// A failing assertion is an uncaught AssertionError: the process exits 1
// with everything printed BEFORE the failure intact on stdout (stderr is
// the uncompared uncaught-throw report — the @exit contract).
import assert from "node:assert";

console.log("step 1");
assert.ok(true, "passes silently");
console.log("step 2");
assert.strictEqual("actual value", "expected value");
console.log("never reached");
