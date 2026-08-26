// @transform-types
// Overloaded functions across module boundaries: import aliases resolve
// to the implementation's collected signature, and namespace-qualified
// overloads take the same direct-call path as bare identifiers.
import { render, Fmt } from "./lib.ts";

console.log(render("a"), render(9));
console.log(Fmt.tag("solo"), Fmt.tag("pair", "body"));
console.log(render === render);
