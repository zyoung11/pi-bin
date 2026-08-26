// @dynamic
// Named ESM imports of CJS modules INSIDE the embedded graph: esmbridge
// (ESM) does `import { alpha, ... } from "cjszoo"` (CJS). The compiler
// lexes each CJS module's export names at build time (cjs-lexer.ts, the
// port of Node's vendored lexer) and synthesizes the ESM facade Node would:
// assignments, defineProperty, the esbuild __export/annotation patterns,
// `module.exports = require(...)` forwarding, string export names,
// lexed-but-unassigned names, and the "module.exports" alias.
import { bridge, names } from "esmbridge";

console.log(bridge() as string);
console.log(names() as string);
