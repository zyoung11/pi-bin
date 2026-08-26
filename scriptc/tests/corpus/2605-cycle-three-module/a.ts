// A THREE-module import ring (a → b → c → a) of mutually-recursive
// functions. Every module's top level is declaration-only and each
// cycle-crossing binding is only called inside a function body, so the
// whole ring is admitted; Node evaluates c, b, a, main and the guarded
// %init calls reproduce that order exactly.
import { hop } from "./b.ts";

export function start(n: number): string {
  return n <= 0 ? "!" : "a" + hop(n - 1);
}
