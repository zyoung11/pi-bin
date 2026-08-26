// @exit: 1
// A types-only package: tsc resolves the import (the shipped .d.ts), but
// Node's runtime resolution refuses the edge — the exports target
// ./index.js does not exist — so Node rejects the whole graph at startup
// (ERR_MODULE_NOT_FOUND), before ANY module evaluates. The program
// compiles to exactly that startup crash: no output, exit 1.
import { x } from "brokenrt";
console.log("never");
