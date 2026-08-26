// npm-static pilot: the real escape-string-regexp package (vendored, pure
// ESM + own .d.ts) compiled STATICALLY. Byte-compared with Node.
import escapeStringRegexp from "escape-string-regexp";

console.log(escapeStringRegexp("How much $ for a 🦄?"));
console.log(escapeStringRegexp("a.b*c+d?e"));
console.log(escapeStringRegexp("[]{}()^$|\\"));
console.log(escapeStringRegexp("plain words"));
console.log(escapeStringRegexp("-dash-and-dot.-"));
console.log(escapeStringRegexp("1+1"));
