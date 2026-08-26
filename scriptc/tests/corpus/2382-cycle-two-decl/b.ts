import { aye, tag } from "./a.ts";
export function bee(n: number): number {
  return n <= 0 ? 0 : aye(n - 1) + 1;
}
export function describe(): string {
  return "tag=" + tag;
}
