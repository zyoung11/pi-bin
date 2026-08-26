// JS file-scope any-residue bindings shared across separately-declared
// functions: the lazy-cache idiom (`let cache = null` written by a getter
// function), the bare `let pending;` ledger, and assignment through a
// checked-dynamic call result — each registers a checked-dynamic module
// global (the evolving-array precedent), so functions declared elsewhere
// in the file reach the SAME storage instead of fencing per reference.
'use strict';

let cache = null;
function localhost() {
  if (cache !== null) return cache;
  cache = '127.0.0.1';
  return cache;
}
console.log(localhost());
console.log(localhost());
console.log(cache);

let pending;
function arm(v) {
  pending = v;
}
function read() {
  return pending;
}
console.log(typeof read());
arm({ tag: 'armed', n: 3 });
console.log(read().tag, read().n);
arm('done');
console.log(read());

// A dyn call result bound at file scope and read from a function declared
// ABOVE the value's first use (module-global storage, not an init local).
const parsed = JSON.parse('{"a": [1, 2, 3]}');
function total() {
  return parsed.a.length;
}
console.log(total());
