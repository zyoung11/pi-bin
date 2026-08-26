// The bundler/node conditions split (bundlerConditionsExcludesNode's
// shape): tsc resolves the package's "default" condition (index.web.d.ts,
// which declares webOnly), but Node's runtime resolution takes the "node"
// condition (index.node.js, which does not export it) — so the program
// type-checks and then link-fails under Node with "The requested module
// 'condsplit' does not provide an export named 'webOnly'", exit 1,
// nothing printed. The island's import boundary throws the same
// SyntaxError with the same message: exit codes and stdout agree.
import { webOnly } from "condsplit";

console.log(`${webOnly}`);
