// @dynamic
// The CJS export shapes Node's vendored lexer detects, differential
// against Node: a require(...) table value (key + reexport + scan stop),
// the tsc __exportStar and Babel copy-loop star patterns unioning names
// down a three-module chain, and the lexer-invisible names staying
// reachable through the default import.
import { bridge, names } from "lexbridge/pos";

console.log(bridge() as string);
console.log(names() as string);
