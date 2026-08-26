// @exit: 1
// Checked-dynamic asserts INSIDE node:test bodies — untyped JS's most
// common assert form running where it matters: strictEqual(dynValue,
// scalar) passes and fails with Node's exact AssertionError messages in
// the failing section (the generated multi-line diff included), the
// deep pair walks the checked-dynamic tree against static literals, and truthiness rides
// assert(dynValue).
import assert from "node:assert";
import { test } from "node:test";

const cfg: unknown = JSON.parse('{"port":8080,"host":"localhost","tags":["a","b"],"debug":false}');
const port: unknown = JSON.parse("8080");

test("dyn scalar assertions pass", () => {
  assert.strictEqual(port, 8080);
  assert.notStrictEqual(port, 8081);
  assert(port);
});

test("dyn deep assertions pass", () => {
  assert.deepStrictEqual(cfg, {
    port: 8080,
    host: "localhost",
    tags: ["a", "b"],
    debug: false,
  });
  assert.notDeepStrictEqual(cfg, { port: 8080 });
});

test("failing dyn strictEqual", () => {
  assert.strictEqual(port, "8080");
});

test("failing dyn deepStrictEqual", () => {
  assert.deepStrictEqual(cfg, {
    port: 8081,
    host: "localhost",
    tags: ["a", "b"],
    debug: false,
  });
});
