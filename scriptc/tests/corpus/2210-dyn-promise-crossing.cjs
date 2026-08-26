// Promises CROSS the checked-dynamic tree (SCR_DYN_PROMISE): a typed
// promise boxes by reference when it flows through an untyped wrapper
// (promise<dyn> directly, other inners through the emitted settle
// adapter), typeof/String()/JSON.stringify answer Node's object forms,
// identity is the promise (=== across two crossings of one value), and
// .then/.catch/.finally on a DYN receiver run as microtask reactions with
// handler-result adoption and rejection passthrough.
'use strict';

function id(v) { return v; } // dyn in, dyn out — the crossing

async function seven() { return 7; }

const p = seven();
const boxedOnce = id(p);
// One box travelling through dyn space keeps its identity (=== is the
// promise, not the crossing). A SECOND boxing of the same typed promise
// mints a fresh adapter (SEMANTICS.md divergence), so the fixture pins
// the dyn-space identity only.
console.log(typeof boxedOnce, String(boxedOnce), JSON.stringify({ p: boxedOnce }));
console.log('same value:', id(boxedOnce) === id(boxedOnce));

// .then on the dyn receiver: the settled value arrives as a dyn value,
// the handler's return feeds the chained promise, and a returned promise
// is ADOPTED before the next link runs.
boxedOnce
  .then((v) => { console.log('then', v); return v + 1; })
  .then((v) => { console.log('chained', v); return seven(); })
  .then((v) => { console.log('adopted', v); });

// .catch and .finally: rejections pass through value handlers, the catch
// handler sees the thrown value, and finally observes without changing
// the settlement.
async function fails() { throw new Error('boom'); }
id(fails())
  .then(() => { console.log('unreachable'); })
  .catch((e) => { console.log('caught', String(e)); return 'recovered'; })
  .finally(() => { console.log('finally ran'); })
  .then((v) => { console.log('after finally', v); });

console.log('sync tail');
