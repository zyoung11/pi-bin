// The module namespace OBJECT as a first-class value: member accesses
// resolve statically (lib.one() compiles), but Node's frozen,
// alphabetically-keyed namespace object is not materialized — storing,
// passing, or iterating it fences by name.
import * as lib from "./lib.ts";

console.log(lib.one());
const grabbed = lib;
console.log(grabbed.one());
