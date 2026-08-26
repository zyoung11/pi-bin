// util.inspect/format through the CommonJS forms test/common uses: the
// destructured require, the namespace binding, and plain-JS (checkJs)
// inference over the values. Node is the oracle byte-for-byte.
"use strict";
const { inspect, format } = require("util");
const util = require("node:util");

console.log(inspect(42));
console.log(inspect("it's"));
console.log(inspect([1, 2, 3]));
console.log(inspect({ a: 1, b: [true, null] }));
console.log(util.inspect(new Map([["k", 1]])));
console.log(util.inspect({ nested: { deep: { gone: 1 } } }));
console.log(format("%s and %d", "x", 7));
console.log(util.format("%j", { j: [1, "two"] }));
console.log(format("tail", 1, "s", [2]));
