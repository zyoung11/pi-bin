// The common/index.js shape: a const table (shorthand members + getters)
// exported through an identity-forwarding Proxy, with `exports` reads
// after the replacement observing the ORIGINAL (empty) exports object.
'use strict';
let hits = 0;
const fixed = 'stone';
function double(n) { return n * 2; }
// After the `module.exports =` below, `exports` still names the replaced
// object (Node's aliasing) — this read answers undefined there and here.
function replacedExportsRead() { return exports.fixed === undefined; }
const table = {
  double,
  replacedExportsRead,
  fixed,
  get hits() { hits += 1; return hits; },
};
const validProperties = new Set(Object.keys(table));
module.exports = new Proxy(table, {
  get(obj, prop) {
    if (!validProperties.has(prop)) throw new Error(`invalid property: ${String(prop)}`);
    return obj[prop];
  },
});
