// One package opted in (escape-string-regexp compiles statically), one
// UNTYPED package left on the island (typegapped ships no .d.ts and its
// JS does not typecheck under this tsconfig). The opt-in's
// maxNodeModuleJsDepth pulls typegapped's JS into the CHECKED program —
// its checker errors must not gate the build (the punycode-through-
// @types/node shape, pinned generally).
import escapeStringRegexp from "escape-string-regexp";
import label from "typegapped";

console.log(escapeStringRegexp("1+1"));
console.log(label(3));
