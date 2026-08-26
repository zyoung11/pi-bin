// @exit: 1
// An UNCAUGHT dyn assert failure: the AssertionError leaves main like
// any uncaught throw — Node exits 1, the native binary must too. The
// stdout before the throw compares byte-exactly (the report format on
// stderr is the documented uncaught divergence).
import assert from "node:assert";

const parsed: unknown = JSON.parse('{"version":2}');
assert.deepStrictEqual(parsed, { version: 2 });
console.log("about to fail");
assert.strictEqual(JSON.parse('"actual"'), "expected");
console.log("unreachable");
