// @dynamic
// An ESM-only package: named exports and the default export, loaded as a
// real ES module by the engine.
import shout, { greet, punctuation } from "greeter";

const hello: string = greet("world");
console.log(hello);
const loud: string = shout("world");
console.log(loud);
const p: string = punctuation;
console.log(p);
