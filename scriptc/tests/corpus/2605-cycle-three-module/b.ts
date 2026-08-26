import { skip } from "./c.ts";

export function hop(n: number): string {
  return n <= 0 ? "!" : "b" + skip(n - 1);
}

export const bTag: string = "B-side";
