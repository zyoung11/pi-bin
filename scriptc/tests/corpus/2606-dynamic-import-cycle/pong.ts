import { ping } from "./ping.ts";

export function pong(n: number): string {
  return n <= 0 ? "." : "o" + ping(n - 1);
}
