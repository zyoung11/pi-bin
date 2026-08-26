// The evolving-array declaration idiom (test/common's leakedGlobals
// ledger): a JS `const leaked = []` types by its LATER pushes, so the
// binding rides the checked-dynamic array — pushes land in the checked-dynamic tree,
// typed exits validate back out, and the function's evolved return type
// agrees with what callers read.
'use strict';
function collect() {
  const leaked = [];
  for (const v of ['alpha', 'beta', 'gamma']) {
    if (v !== 'beta') {
      leaked.push(v);
    }
  }
  return leaked;
}
const out = collect();
console.log(out.length);
console.log(out.join(', '));
console.log(out.length > 0 ? 'leaked' : 'clean');

// The number flavor, and an empty-forever ledger.
function nums() {
  const acc = [];
  acc.push(1);
  acc.push(2);
  return acc;
}
console.log(JSON.stringify(nums()));
function never() {
  const empty = [];
  return empty;
}
console.log(never().length);
