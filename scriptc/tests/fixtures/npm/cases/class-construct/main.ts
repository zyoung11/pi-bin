// @dynamic
// `new X(...)` on a package-declared class: the construct op
// (JS_CallConstructor); the instance stays an island handle, methods
// chain, results exit at the declared types.
import { Counter } from "counter";

const c = new Counter(10);
c.inc(5).inc(2);
const v: number = c.value();
console.log(v);
const tag: string = c.label("n");
console.log(tag);
const fresh: number = new Counter(0.5).inc(0.25).value();
console.log(fresh);
