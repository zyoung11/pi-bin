// SC4020 fixture: untyped resolves at runtime but ships no declaration
// surface at all — refused by the bar's own-.d.ts requirement, never a
// generic import fence.
import { rawAdd } from "untyped";

export function f(a: number, b: number): number {
  return rawAdd(a, b);
}
