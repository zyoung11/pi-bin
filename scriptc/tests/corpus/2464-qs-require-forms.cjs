// node:querystring through every CommonJS acquisition spelling a JS
// package uses (the HTTP-client dependency chains that import it
// unguarded are CJS): the whole-module require binding, the destructured
// require, the member-binding require, the inline require member call,
// and the decode/encode aliases — all keying the same lowering tables.
"use strict";

const querystring = require("node:querystring");
const { parse, stringify } = require("querystring");
const esc = require("querystring").escape;

console.log("Q1", JSON.stringify(querystring.parse("a=1&a=2&b=x%20y+z&c")));
console.log("Q2", querystring.stringify({ a: 1, arr: [1, "x", true], u: "héllo ☃", s: "a b", e: "" }));
console.log("Q3", querystring.escape("héllo ☃ a+b!'()*~"));
console.log("Q4", querystring.unescape("a+b%20c%E2%98%83%zz"));
console.log("Q5", JSON.stringify(querystring.decode("x=1&x=2")));
console.log("Q6", querystring.encode({ x: [1, 2] }));

console.log("D1", JSON.stringify(parse("a:1;b:2", ";", ":")));
console.log("D2", JSON.stringify(parse("a=1&b=2&c=3", null, null, { maxKeys: 2 })));
console.log("D3", stringify({ k: ["v", "w"] }, ";", ":"));

console.log("M1", esc("a b+c"));
console.log("M2", require("querystring").unescape("%E2%98%83"));

// Results feed ordinary JS flows: property reads, Array.isArray splits.
const parsed = parse("tag=a&tag=b&page=2");
const tags = parsed.tag;
if (Array.isArray(tags)) console.log("R1", tags.join(","));
const page = parsed.page;
if (typeof page === "string") console.log("R2", page);
