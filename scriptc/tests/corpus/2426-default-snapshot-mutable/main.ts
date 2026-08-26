import d, { bump, read } from "./m.ts";
import dw, { bumpW } from "./live.ts";
import * as m from "./m.ts";

console.log(d, m.default);
bump();
console.log(d, m.default, read());
console.log(dw);
bumpW();
console.log(dw);
