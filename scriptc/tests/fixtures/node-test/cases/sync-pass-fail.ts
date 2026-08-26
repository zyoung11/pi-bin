// @exit: 1
// Sync bodies: passes report ✔, a throwing body reports ✖, lands in the
// failing-tests section with its message, and fails the process.
import { test } from "node:test";

test("first passes", () => {
  const x = 2 + 2;
  if (x !== 4) throw new Error("math broke");
});

test("second fails", () => {
  throw new Error("deliberate failure");
});

test("third still runs", () => {});
