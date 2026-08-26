// node:assert — passing assertions are silent and fall through: every
// form here succeeds, prints nothing of its own, and execution reaches
// each marker in order. The default import IS the callable module
// (assert(x) is assert.ok(x)), exactly Node's module object.
import assert from "node:assert";

assert(true);
assert(1);
assert("nonempty");
assert(2 > 1, "never shown");
console.log("bare ok");

assert.ok(42);
assert.ok("".length === 0);
assert.ok("x", "never shown either");
console.log("member ok");

assert.strictEqual(2 + 2, 4);
assert.strictEqual("con" + "cat", "concat");
assert.strictEqual(true, true);
assert.strictEqual(0, -0 === 0 ? 0 : 1); // strictEqual is Object.is: only same-sign zero passes
assert.strictEqual(0 / 0, 0 / 0); // NaN IS NaN under Object.is
assert.notStrictEqual(1, 2);
assert.notStrictEqual("a", "b");
assert.notStrictEqual(0, -0); // Object.is distinguishes the zeros
assert.notStrictEqual(false, true);
console.log("strict ok");

assert.deepStrictEqual(7, 7);
assert.deepStrictEqual("deep", "deep");
assert.deepStrictEqual([1, 2, 3], [1, 2, 3]);
assert.notDeepStrictEqual([1, 2, 3], [1, 2, 4]);
console.log("deep scalars ok");

assert.match("hello world", /wor/);
assert.match("HELLO", /hello/i);
assert.doesNotMatch("hello", /xyz/);
console.log("match ok");

assert.throws(() => {
  throw new Error("expected");
});
console.log("throws ok");
console.log("done");
