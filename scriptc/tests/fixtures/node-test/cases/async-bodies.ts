// @exit: 1
// Async bodies: awaited timers inside tests interleave through the event
// loop, tests still run SEQUENTIALLY in declaration order, and a rejected
// await fails the test like a sync throw.
import assert from "node:assert";
import { test } from "node:test";

let order = "";

test("async pass with timer", async () => {
  await new Promise<void>((resolve) => setTimeout(resolve, 5));
  order += "a";
});

test("async sees prior test done", async () => {
  assert.strictEqual(order, "a");
  await new Promise<void>((resolve) => setTimeout(resolve, 1));
  order += "b";
});

test("async rejection fails", async () => {
  await new Promise<void>((_resolve, reject) => {
    setTimeout(() => reject(new Error("rejected in a timer")), 5);
  });
});

test("runs after the failure", () => {
  assert.strictEqual(order, "ab");
});
