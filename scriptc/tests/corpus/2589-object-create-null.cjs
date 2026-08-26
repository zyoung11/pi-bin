// Object.create(null) — the null-prototype DICTIONARY (prettier's
// index.cjs/groupModeMap idiom: create, then keyed assignment): a fresh
// dyn object flagged prototype-free. Keyed reads/writes, Object.keys,
// JSON, `in`, and Object.hasOwn are the checked-dynamic tree's usual own-member walks —
// which ARE Node's null-proto answers (no prototype to consult) — while
// the observations that SEE the prototype follow the flag: util.inspect
// prefixes "[Object: null prototype]" (nested and beyond-depth forms
// included), o.toString() throws Node's "is not a function" (nothing
// inherited), and deepStrictEqual separates it from plain objects
// (Node compares prototypes). Node is the oracle byte-for-byte.
"use strict";
const assert = require("node:assert");

const o = Object.create(null);
console.log(o);
console.log(typeof o, JSON.stringify(o), Object.keys(o).join(","));

// Assignment creates own properties — dotted and computed keys alike.
o.x = 1;
o["with space"] = "v";
console.log(o);
console.log({ wrapped: o });
console.log(JSON.stringify(o), Object.keys(o).join(","));
console.log("x" in o, Object.hasOwn(o, "x"), Object.hasOwn(o, "nope"));
console.log(o.x, o.missing);

// Nothing inherited: toString is simply not there.
try {
  o.toString();
} catch (err) {
  console.log("caught:", err.message);
}

// The word-count memo idiom: runtime keys, read-modify-write.
const counts = Object.create(null);
for (const w of ["a", "b", "a", "a"]) counts[w] = (counts[w] || 0) + 1;
console.log(counts.a, counts.b, JSON.stringify(counts));

// deepStrictEqual: equal null-proto dictionaries pass; a plain object
// never equals a null-proto one (Node's prototype comparison), and the
// failure diff renders Node's prefix.
assert.deepStrictEqual(o, Object.assign(Object.create(null), { x: 1, "with space": "v" }));
try {
  assert.deepStrictEqual({}, Object.create(null));
} catch (err) {
  console.log("DSE:", err.message.split("\n").slice(0, 4).join("|"));
}

// Beyond inspect's depth the marker stands alone; the empty form keeps
// its braces at any depth.
const deep = { a: { b: { c: Object.create(null) } } };
console.log(deep);
deep.a.b.c.d = 1;
console.log(deep);

console.log("done");
