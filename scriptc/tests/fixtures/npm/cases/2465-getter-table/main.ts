// The bundler-emitted getter-table export shape (__export(target, { name:
// () => value }) behind module.exports = __toCommonJS(target)) compiles
// statically under the opt-in: named imports type by their resolved
// VALUES (renamed locals, member-access getter bodies, mutable-var
// snapshots), and a lexer-visible-but-valueless name (the chunk-wrapped
// exports.N= merve detects with no scope analysis) binds undefined,
// exactly Node's link answer.
import { greet, VERSION, metaTag, counterStart, chunkGhost } from "gtable";
import def from "gtable";

console.log(greet("pal"), VERSION, metaTag, counterStart);
console.log(typeof chunkGhost);
console.log(def.VERSION);
