// queueMicrotask: the callback enters the SAME FIFO promise
// continuations ride (one microtask order, V8's queue), non-function
// arguments throw Node's ERR_INVALID_ARG_TYPE synchronously, and
// microtasks drain before timers.
'use strict';
const assert = require('assert');
assert.strictEqual(typeof queueMicrotask, 'function');
[undefined, null, 0, 'x = 5'].forEach((t) => {
  assert.throws(() => { queueMicrotask(t); }, { code: 'ERR_INVALID_ARG_TYPE' });
});
{
  let called = false;
  queueMicrotask(() => { called = true; });
  assert.strictEqual(called, false);
}
{
  const q = [];
  Promise.resolve().then(() => q.push('a'));
  queueMicrotask(() => q.push('b'));
  Promise.resolve().then(() => q.push('c'));
  queueMicrotask(() => { console.log(JSON.stringify(q)); });
}
setTimeout(() => console.log('timer-after-micro'), 0);
queueMicrotask(() => console.log('micro-1'));
