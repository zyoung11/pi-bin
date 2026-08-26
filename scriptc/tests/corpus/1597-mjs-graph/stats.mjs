// Second module of the .mjs graph — imports a sibling, re-exports work.
import { shout } from "./util.mjs";

/** @param {number[]} xs */
export function mean(xs) {
  let sum = 0;
  for (const x of xs) sum += x;
  return sum / xs.length;
}

export function banner() {
  return shout("stats ready");
}
