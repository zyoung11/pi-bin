import { record } from "./shared.ts";
export function fromA(): string {
  return "A";
}
console.log("init a");
record("a");
