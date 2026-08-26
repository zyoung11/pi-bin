// `.then(handler)` with a CHECKED-DYNAMIC handler VALUE (the Node-suite
// `p.then(common.mustCall())` shape): the settled value crosses into the
// handler through the checked-dynamic tree (void settles deliver JS's explicit undefined
// argument), rejections pass through to a chained .catch, and the traced
// microtask ordering matches Node's.
'use strict';

function mustCallish(fn) {
  return function (...args) { return fn.apply(this, args); };
}

async function work() {
  return 7;
}

async function quiet() {}

work().then(mustCallish((v) => { console.log('value', v); }));
quiet().then(mustCallish((v) => { console.log('void-settle', v, typeof v); }));

async function fails() {
  throw new Error('nope');
}
fails()
  .then(mustCallish(() => { console.log('unreachable'); }))
  .catch((e) => { console.log('caught', String(e)); });

console.log('sync tail');
