// @transform-types
import { pick, label, Util } from "./lib.ts";
import * as lib from "./lib.ts";

// Named-import calls monomorphize cross-module.
console.log(pick([10, 20, 30], 1));
console.log(pick(["a", "b"], 0));
console.log(label(5), label("t"));

// Namespace-member calls (`namespace Util` inside the exporter).
console.log(Util.twice(3).length, Util.twice("x")[1]);

// Module-namespace-object member calls and pinned member values.
console.log(lib.pick([true, false], 0));
const pinned: (x: string) => string = lib.label;
console.log(pinned("p"));

// The import alias and the local spelling share one instance table.
const viaNamed: (x: string) => string = label;
console.log(viaNamed === pinned);
