// A package importing ITSELF by its own "name" through its own "exports"
// (Node's self-reference rule) — the benign self-cycle: the imported
// bindings alias this module's OWN top-level bindings with identical
// timing (hoisted functions callable, initialized consts readable),
// evaluation happens once, and the bare `self;` statement is Node's
// no-op. `#me` maps to a BARE specifier target — Node re-enters
// PACKAGE_RESOLVE from the imports field and lands on the same
// self-reference. Targets name the .ts sources directly, so Node runs
// the identical graph.
import * as self from "selfimp-corpus";
import { greet as g, VALUE as V } from "selfimp-corpus";
import * as viaAlias from "#me";
import { sib } from "#sib";
self;
viaAlias;
export function greet(): string {
  return "hi";
}
export const VALUE = 42;
console.log(greet(), VALUE, g(), V, self.VALUE, self.greet(), viaAlias.VALUE, sib);
