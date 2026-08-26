// Closes the cycle with a NAMED import read only from a function body
// (the deferred position the admission demands).
import { A } from "./a";

export function helper(n: number): string {
  return A + n;
}
