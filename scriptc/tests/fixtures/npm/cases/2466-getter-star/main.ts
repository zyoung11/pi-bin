// The esbuild star re-export (__reExport(target, require("./extra.js"),
// module.exports) mirrored by the annotation's spread): starred names
// type per-name through the target module's own surface and compile to
// direct reads of its exports.
import { local, extraFn, EXTRA } from "gtstar";

console.log(local, extraFn(21), EXTRA);
