import { record } from "./shared.ts";
import { fromA } from "./a.ts";
export function fromB(): string {
  return fromA() + "B";
}
console.log("init b");
record("b");
