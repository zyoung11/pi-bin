// Idiomatic JavaScript where tsc's inference suffices: consts, template
// literals, arrays, for-of, ternaries — no JSDoc except the one place
// inference has nothing to grab (a bare `new Map()`, the same place TS
// needs `new Map<string, number>()`).
'use strict';

const base = 7;
const doubled = base * 2;
const label = `base=${base} doubled=${doubled}`;
console.log(label);

const fruits = ["kiwi", "fig", "banana", "apple"];
fruits.sort();
console.log(fruits.join(","));

let vowels = 0;
for (const f of fruits) {
  for (const ch of f) {
    if ("aeiou".includes(ch)) vowels++;
  }
}
console.log("vowels:", vowels);

const sizes = fruits.map((f) => f.length);
const total = sizes.reduce((acc, n) => acc + n, 0);
console.log("sizes:", sizes.join("+"), "=", total);

const parity = total % 2 === 0 ? "even" : "odd";
console.log(parity, Math.max(...sizes), Math.min(...sizes));

// The JSDoc CAST form: `@type` on the declaration does not reach through
// JS's evolving-container inference for a bare `new Map()` — the cast
// types the expression itself (TS's `new Map<string, number>()`).
const counts = /** @type {Map<string, number>} */ (new Map());
for (const f of fruits) counts.set(f[0], (counts.get(f[0]) ?? 0) + 1);
console.log("a-fruits:", counts.get("a") ?? 0, "z-fruits:", counts.get("z") ?? 0);
