// @exit: 1
// An ambient-only module: the type surface exists (shorthand declare
// module), but nothing installed resolves 'ambpkg' at runtime — Node
// refuses the graph at startup (Cannot find package), and the program
// compiles to exactly that crash: no output, exit 1.
/// <reference path="./decl.d.ts" />
import amb from "ambpkg";
console.log("never");
