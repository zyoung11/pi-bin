// The TestContext surface: t.name reads the test's own name, t.diagnostic
// queues ℹ lines after the result line, and t.skip/t.todo mark the
// RUNNING test (the body keeps executing — skipped-by-t.skip counts
// skipped even though it ran).
import assert from "node:assert";
import { test } from "node:test";

test("knows its name", (t) => {
  assert.strictEqual(t.name, "knows its name");
});

test("emits diagnostics", (t) => {
  t.diagnostic("first note");
  t.diagnostic("second note");
});

test("skips itself", (t) => {
  t.skip("decided at runtime");
});

test("todos itself", (t) => {
  t.todo("revisit this one");
});
