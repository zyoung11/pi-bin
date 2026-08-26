// Symbols through util.inspect / util.format: inspect prints the
// toString text unquoted, %s matches inspect, plain args ride the same
// path, and %j is JSON's answer for symbols — the "undefined" text.
import { format, inspect } from "node:util";

const sym: symbol = Symbol("foo");
const anon: symbol = Symbol();
const reg: symbol = Symbol.for("reg.key");

console.log(inspect(sym));
console.log(inspect(anon));
console.log(inspect(reg));
console.log(format(sym));
console.log(format("foo", sym));
console.log(format("%s", sym));
console.log(format("%s %s", sym, anon));
console.log(format("%j", sym));
console.log(format("%s", sym) === inspect(sym));
