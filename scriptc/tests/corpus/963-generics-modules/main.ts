// Imported generic functions monomorphize at the importer's call sites;
// instantiations are shared program-wide (whole-program compilation).
import { identity, lastOf, localUse } from "./util.ts";

console.log("main", localUse);
console.log(identity(10), identity("ten"), identity(true));
console.log(lastOf([1, 2, 3]), lastOf(["a", "z"]));

// Cross-module generic call inside a local generic function.
function wrap<T>(x: T): string {
  return `[${identity(x)}]`;
}
console.log(wrap(5), wrap("five"));
