// @exit: 1
// The lexer scans `module.exports = { ... }` left to right and STOPS at
// the first prop it cannot shape: `{ vis: v, lit: 7 }` exports only
// `vis`. Node checks a module's named imports sorted by LOCAL binding
// name (lit before vis), finds `lit` missing, and refuses the graph — the
// visible `vis` in the same import statement does not save it.
import { vis, lit } from './cjs.cjs';

console.log('never runs', vis, lit);
