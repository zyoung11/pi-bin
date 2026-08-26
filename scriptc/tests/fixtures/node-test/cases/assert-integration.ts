// @exit: 1
// assert inside test bodies: a failing strictEqual fails the test with
// Node's exact AssertionError message (the multi-line generated form) in
// the failing section, assert.throws catches expected throws, and
// t.assert.* is the same surface bound to the test.
import assert from "node:assert";
import { test } from "node:test";

test("passing assertions", () => {
  assert.ok(1 + 1 === 2);
  assert.strictEqual("scriptc", "scr" + "iptc");
  assert.deepStrictEqual([1, 2, 3], [1, 2, 3]);
});

test("assert.throws catches", () => {
  assert.throws(() => {
    throw new Error("expected throw");
  });
});

test("failing strictEqual", () => {
  assert.strictEqual(1 + 1, 3);
});

test("failing with message", () => {
  assert.ok(false, "the custom explanation");
});

test("t.assert surface", (t) => {
  t.assert.ok(true);
  t.assert.strictEqual(4, 4);
});
