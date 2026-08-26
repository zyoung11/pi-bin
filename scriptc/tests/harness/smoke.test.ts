import { expect, test } from "vitest";
import { VERSION } from "@scriptc/compiler";

test("workspace wiring", () => {
  expect(VERSION).toBe("0.0.1");
});
