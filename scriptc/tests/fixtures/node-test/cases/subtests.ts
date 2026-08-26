// @exit: 1
// t.test subtests: awaited subtests report indented under their parent,
// a failing subtest fails the parent (both count as fail), and the
// failing section lists the subtest's own error.
import assert from "node:assert";
import { test } from "node:test";

test("parent with passing subtests", async (t) => {
  await t.test("sub one", () => {});
  await t.test("sub two", () => {
    assert.strictEqual("a" + "b", "ab");
  });
});

test("parent with a failing subtest", async (t) => {
  await t.test("good sub", () => {});
  await t.test("bad sub", () => {
    throw new Error("subtest failure");
  });
});

test("subtests with directives", async (t) => {
  await t.test("skipped sub", { skip: true }, () => {
    throw new Error("never runs");
  });
  await t.test("todo sub", { todo: true }, () => {});
});
