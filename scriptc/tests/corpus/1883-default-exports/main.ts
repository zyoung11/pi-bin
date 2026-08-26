// Default exports/imports across the module graph: named default
// function/class declarations, expression defaults, export { x as
// default }, default re-exports, and the d-plus-named import combo.
import double, { label } from "./double.ts";
import Counter from "./counter.ts";
import cfg from "./hub.ts";
import { pick } from "./hub.ts";

console.log(label, double(4));
const c = new Counter();
c.bump();
console.log(c.bump());
console.log(cfg.retries, cfg.host);
console.log(pick + 1);
