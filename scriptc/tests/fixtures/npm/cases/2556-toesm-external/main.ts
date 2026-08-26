// esbuild's ESM-interop wrapper around EXTERNAL (unbundled) dependencies:
// gtwrap's shipped CJS does `var import_x = __toESM(require("x"))` — the
// wrapper erases at build time (the recognized helper pads down to the
// bare require it wraps), member accesses model on the required package's
// canonical table, `.default` reads bind the module itself for a plain-CJS
// target (gtcore; the `, 1` node-mode variant unconditionally) and stay
// member reads for an __esModule-stamped one (gtable, an esbuild bundle).
import { describeDep, viaDefault, viaBundle } from "gtwrap";

console.log(describeDep());
console.log(viaDefault());
console.log(viaBundle());
