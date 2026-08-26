// { only: true } and the test.only twin: when any top-level test is
// marked only, the unmarked ones never run, never report, and never
// count (Node's v24 behavior without any CLI flag).
import { test } from "node:test";

test("marked via options", { only: true }, () => {});

test.only("marked via the twin", () => {});

test("never runs", () => {
  throw new Error("the only filter should have dropped this");
});
