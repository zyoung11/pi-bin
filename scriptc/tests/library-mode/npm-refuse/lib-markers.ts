// SC4020 fixture: webbundle ships its own .d.ts and readable JS, but the
// dist carries a build-transform marker — the bar refuses it by name.
import { probe } from "webbundle";

export function f(): string {
  return probe();
}
