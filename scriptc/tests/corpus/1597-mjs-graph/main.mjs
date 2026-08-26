// The .mjs import graph: two local modules, shared state observed through
// both import paths (util is evaluated once — Node's module semantics).
import { shout, useCount, MOTTO } from "./util.mjs";
import { mean, banner } from "./stats.mjs";

console.log(banner());
console.log(shout("hello"), MOTTO);
console.log("mean:", mean([2, 4, 6, 8]));
console.log("uses:", useCount());
