// @exit: 1
// `export { a } from './cjs.cjs'` is checked against the CJS module's
// LEXED names when the re-exporting module instantiates — depth-first,
// before the entry's own imports — so the invisible `a` kills the graph
// from inside mid.mjs (Node's message even keeps V8's generic wording
// here: the CommonJS hint rewrite only fires when the failing specifier
// is one of the ENTRY's own requests).
import { a } from './mid.mjs';

console.log('never runs', a);
