// Variadic-spread Object.assign over checked-dynamic targets — the
// support.js option-table merge (`Object.assign({}, ...plugins.map(
// ({options}) => options), coreOptions)`): every source evaluates and
// FLATTENS into one pack before any copying (JS's
// ArgumentListEvaluation — a throwing spread leaves the target
// untouched), then each source's own enumerable keys copy left to
// right and the TARGET returns (identity, like JS). Nullish sources
// copy nothing; string/array sources contribute their index keys;
// scalars nothing. Spread failures carry V8's exact TypeError texts,
// which differ by POSITION: the single-last spread takes the optimized
// apply-path texts (the nullish form spells the spread expression),
// every other spread position drives the real iterator protocol, whose
// failure describes the value. Node is the oracle byte-for-byte.
"use strict";

// The prettier support.js shape: a mapped spread plus a trailing
// literal; a plugin without options contributes the skipped undefined.
const plugins = JSON.parse(
  '[{"options":{"semi":{"default":true}}},{"options":{"tabWidth":{"default":2}}},{"name":"bare"}]',
);
const coreOptions = { core: 1 };
const supportOptions = Object.assign({}, ...plugins.map(({ options }) => options), coreOptions);
console.log(JSON.stringify(supportOptions));
console.log(Object.keys(supportOptions).join(","));

// Identity: the target mutates in place and IS the result.
const seed = JSON.parse('{"seed":0}');
const merged = Object.assign(seed, ...JSON.parse('[{"a":1},{"b":2}]'));
console.log(merged === seed, JSON.stringify(seed));

// Later sources win, mixed plain and spread positions.
console.log(JSON.stringify(Object.assign({}, { k: 1 }, ...JSON.parse('[{"k":2},{"k":3}]'), { k: 4 })));

// Non-object sources: nullish and scalars copy nothing; strings and
// arrays copy their index keys (the string's units lose to the array's).
console.log(JSON.stringify(Object.assign({}, "ab", [10, 20], null, undefined, 5, true, JSON.parse('{"z":9}'))));

// The one-argument form answers the target itself.
console.log(JSON.stringify(Object.assign(JSON.parse('{"solo":1}'))));

// A throwing spread leaves the target untouched: flattening completes
// before any copy, so `keep` never gains a key.
const keep = JSON.parse('{"keep":0}');
try {
  Object.assign(keep, ...JSON.parse('[{"p":1}]'), ...null);
} catch (err) {
  console.log("caught:", err.message);
}
console.log(JSON.stringify(keep));

// V8's spread TypeError texts by position: the single-last spread
// spells the expression (apply path); non-last and multi-spread
// positions describe the value (iterator path).
function probeLast(v) {
  try {
    return Object.assign({}, ...v);
  } catch (err) {
    console.log("caught:", err.message);
    return null;
  }
}
probeLast(null);
probeLast(undefined);
probeLast(42);
probeLast(JSON.parse("{}"));
function probeMixed(v) {
  try {
    return Object.assign({}, ...v, { tail: 1 });
  } catch (err) {
    console.log("caught:", err.message);
    return null;
  }
}
probeMixed(null);
probeMixed(undefined);
probeMixed(42);
probeMixed(true);
probeMixed(JSON.parse("{}"));

// Sources evaluate in source order, exactly once.
const order = [];
const probe = (k, v) => {
  order.push(k);
  return v;
};
Object.assign(probe("t", {}), probe("s1", { x: 1 }), ...probe("sp", JSON.parse("[{}]")), probe("s2", { y: 2 }));
console.log(order.join(","));

// A nullish TARGET throws Node's ToObject TypeError, catchably.
try {
  Object.assign(null, { a: 1 });
} catch (err) {
  console.log("caught:", err.message);
}

console.log("done");
