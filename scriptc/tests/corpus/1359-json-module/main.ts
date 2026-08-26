// JSON module default imports: the document bakes into a record global at
// BUILD time (resolveJsonModule types it structurally; the lowerer parses
// the file and emits literal IR). Node runs the same import natively (the
// `with { type: "json" }` attribute is Node's ESM requirement), so every
// field access is a differential assertion.
import pkg from "./data.json" with { type: "json" };

console.log(pkg.name, pkg.version);
console.log(pkg.count + 1, pkg.enabled);
console.log(pkg.keywords.length, pkg.keywords[0], pkg.keywords[2]);
console.log(pkg.config.retries * 2, pkg.config.mode);
console.log(pkg.config.flags[0], pkg.config.flags[1]);
// The "@scoped/dep" field has no property-access syntax here (bracket
// access on records is out of scope) but it BAKES — special characters
// ride the field-name mangling into the emitted struct.
