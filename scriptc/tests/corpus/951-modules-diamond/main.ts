// Diamond: main → a, b; a → shared; b → shared, a.
// Node evaluates depth-first postorder, each module once:
// shared, a, b, main — verified byte-exact against Node.
import { fromA } from "./a.ts";
import { fromB } from "./b.ts";
import { inits, record } from "./shared.ts";
console.log("init main");
record("m");
console.log(inits, fromA(), fromB());
