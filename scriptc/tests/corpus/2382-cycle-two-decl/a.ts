import { bee } from "./b.ts";
export function aye(n: number): number {
  return n <= 0 ? 0 : bee(n - 1) + 1;
}
export const tag: string = "a-side";
