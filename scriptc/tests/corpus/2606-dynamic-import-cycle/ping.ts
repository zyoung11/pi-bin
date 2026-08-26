import { pong } from "./pong.ts";

export function ping(n: number): string {
  return n <= 0 ? "." : "i" + pong(n - 1);
}
