// An ES module pulled in by require(): its OWN imports must evaluate
// before its body — the hoisted header inside its run-once init.
import { two } from './base.mjs';

console.log('mid: init');

export function four() {
  return two() * 2;
}
