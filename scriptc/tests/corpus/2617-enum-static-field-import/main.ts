// A default-imported class carrying an enum object in a STATIC field:
// the collect-time probe on `let a = Def.E.one` resolves the import
// alias, and at 0.0.10 that resolution flushed SomeClass's deferred
// "enum objects as values" fence onto the build (the tsxDefaultImports
// corpus regression). The probe is side-effect-free now; the qualified
// member read compiles to its constant exactly as it did at 0.0.9.
import { default as Def } from "./a.ts";
let a = Def.E.one;
console.log("member", a);
