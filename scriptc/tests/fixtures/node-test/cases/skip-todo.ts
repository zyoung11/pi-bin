// Skip and todo, all four spellings: options ({ skip }, { todo }, with
// and without messages), the method twins, and the fn-less registration.
// Skipped bodies never run (a throw inside proves it); todo bodies run
// and even a throwing one keeps exit 0 (Node's contract).
import { test } from "node:test";

test("plain skip", { skip: true }, () => {
  throw new Error("never runs");
});

test("skip with message", { skip: "waiting on the frobnicator" }, () => {
  throw new Error("never runs");
});

test.skip("skip twin", () => {
  throw new Error("never runs");
});

test("plain todo", { todo: true }, () => {});

test("todo with message", { todo: "finish the design first" }, () => {});

test.todo("todo twin");

test("todo that throws", { todo: true }, () => {
  throw new Error("still todo, exit stays 0");
});

test("explicit false runs", { skip: false }, () => {});
