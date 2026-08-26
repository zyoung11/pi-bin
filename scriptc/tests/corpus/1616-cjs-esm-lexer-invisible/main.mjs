// @exit: 1
// Node builds a CJS module's named-export facade from its LEXER, never
// from execution: `module.exports = { a: 7 }` is a real export to the
// checker but INVISIBLE to the lexer (literal-valued table keys never
// match), so Node refuses the whole graph with a link-time SyntaxError
// before any module evaluates — no output, exit 1. The compiled program
// must be exactly that startup crash.
import { a } from './cjs.cjs';

console.log('never runs', a);
