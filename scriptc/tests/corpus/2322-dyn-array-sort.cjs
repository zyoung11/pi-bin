// Array methods over VALUES living in the checked-dynamic tree under array-mapped checker
// types — the record family's array sibling (corpus 2300's stance):
// `.sort()` on a checked-dynamic array runs the REAL method through the
// runtime receiver-kind dispatch (dynInvoke) — the spec's snapshot sort,
// stable, undefined sinking last, default comparator over ToString
// images, comparator calls JS-exact, the receiver answered by identity.
// Every static-receiver spelling here was an SC9001 ICE (call %arr.sort
// arg 0: expected array, got dyn).
'use strict';

// Object.keys of a dyn object answers a dyn array; .sort() orders it.
const d = JSON.parse('{"beta":1,"alpha":2,"gamma":3}');
console.log(Object.keys(d).sort().join(','));

// Default sort compares ToString images — numbers order lexically.
const nums = JSON.parse('[3,1,10,2]');
const same = nums.sort();
console.log(nums.join(','), 'identity', same === nums);

// A comparator orders numerically; the sort is in place.
nums.sort((a, b) => a - b);
console.log(nums.join(','));
nums.sort((a, b) => b - a);
console.log(nums.join(','));

// Strings, with a length tie broken stably by the default comparator.
console.log(JSON.parse('["b","a","c","aa"]').sort().join(','));

// undefined sinks to the end before any comparison; null sorts by text.
const holes = JSON.parse('[null,2,1]');
holes.push(undefined);
holes.sort();
console.log(holes.join(','), holes.length);

// A throwing comparator propagates catchably, and a non-function
// comparator throws V8's own TypeError.
try {
  nums.sort(() => { throw new Error('cmp-boom'); });
} catch (e) {
  console.log('caught', e.message);
}
try {
  nums.sort('nope');
} catch (e) {
  console.log(e.name, e.message);
}

// The chained consumer shape: sort feeding join, and a sorted dyn array
// validating into a typed slot.
const keys = Object.keys(JSON.parse('{"z":0,"a":0,"m":0}')).sort();
console.log(keys.join('|'), keys.length);
