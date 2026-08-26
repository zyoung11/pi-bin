// SC4020 fixture: slimmed ships a one-long-line dist — minified JS fails
// the eligibility bar.
import { pick } from "slimmed";

export function f(a: number, b: number): number {
  return pick(a, b);
}
