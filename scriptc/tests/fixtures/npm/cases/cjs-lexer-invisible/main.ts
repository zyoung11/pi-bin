// @dynamic
// The 235 shape: `module.exports = { get hidden() {...} }` type-checks a
// named import of `hidden`, but Node's lexer sees NO exports in a
// getter-only table — Node refuses the embedded graph at instantiate with
// a link-time SyntaxError (exit 1, nothing on stdout) and the compiled
// binary must fail the same way.
import { reveal } from "lexbridge/neg";

console.log(reveal() as string);
