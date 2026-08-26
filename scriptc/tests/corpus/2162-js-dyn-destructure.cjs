// Object destructuring of CHECKED-DYNAMIC sources in JS files: plain
// elements, renames, defaults (fired exactly on the undefined read,
// evaluated lazily), nested patterns, absent members, and the TypeError
// on a nullish source (name printed — the message text is a documented
// divergence from Node's "Cannot destructure" wording).
'use strict';

function give(x) { return x; }

const src = give({ a: 1, b: 'two', nested: { c: true, d: null } });
const { a, b: renamed, missing = 'dflt', nested: { c, d } } = src;
console.log(a, renamed, missing, c, d);

// The default must NOT evaluate when the member is present.
let evals = 0;
function dflt() { evals++; return 'lazy'; }
const { a: hit = dflt(), nope = dflt() } = give({ a: 'present' });
console.log(hit, nope, evals);

// Assignment through deeper access chains after the destructure.
const { nested } = give({ nested: { deep: { k: 'v' } } });
console.log(nested.deep.k);

// A nullish source throws JS's TypeError.
try {
  const { q } = give(undefined);
  console.log('unreachable', q);
} catch (e) {
  console.log('threw', e.name);
}
try {
  const { r } = give(null);
  console.log('unreachable', r);
} catch (e) {
  console.log('threw', e.name);
}
