import { start } from "./a.ts";
import { bTag } from "./b.ts";

export function skip(n: number): string {
  return n <= 0 ? "!" : "c" + start(n - 1);
}

// A value binding through the cycle, used only inside a function body:
// by the time any caller can reach this, every ring member initialized.
export function sideTag(): string {
  return "seen " + bTag;
}
