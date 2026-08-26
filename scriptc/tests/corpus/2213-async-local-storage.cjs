// AsyncLocalStorage (node:async_hooks) — the minimal core: run() installs
// the store for the callback's synchronous extent AND across its awaits
// (the context rides the fiber), getStore() answers by IDENTITY, nested
// runs shadow and restore, exit() clears for its window, run's extra
// arguments forward, and a spawned async call inherits the spawner's
// context (Node's init-time capture) even after the outer run returned.
'use strict';
const { AsyncLocalStorage } = require('async_hooks');
const assert = require('assert');

const als = new AsyncLocalStorage();
const outer = { name: 'outer' };
const inner = { name: 'inner' };

console.log('before:', als.getStore());

const returned = als.run(outer, (a, b) => {
  assert.strictEqual(als.getStore(), outer); // identity
  console.log('in run:', als.getStore().name, 'args:', a, b);
  als.run(inner, () => {
    console.log('nested:', als.getStore().name);
  });
  console.log('restored:', als.getStore().name);
  const cleared = als.exit(() => String(als.getStore()));
  console.log('exit window:', cleared);
  console.log('after exit:', als.getStore().name);
  return 'run-result';
}, 1, 2);
console.log('returned:', returned, '| after:', als.getStore());

// The async crossing: a fiber spawned INSIDE run keeps the context across
// its awaits, even though the outer run exits before it resumes.
async function later() {
  assert.strictEqual(als.getStore(), outer);
  await Promise.resolve(0);
  console.log('across await:', als.getStore().name);
}
als.run(outer, () => { later(); });
console.log('outer done:', als.getStore());
