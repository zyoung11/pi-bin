// diagnostics_channel bindStore/runStores — Node's store choreography:
// runStores enters every bound store (transform(data), identity without
// one) around BOTH the publish (subscribers observe getStore()) and the
// callback, forwards this/arguments, restores on exit (nested runStores
// shadow), re-binding replaces the transform, unbindStore answers
// found-ness, and a bound-but-unsubscribed channel still counts as
// active for the tracing early exits (hasSubscribers).
'use strict';
const { AsyncLocalStorage } = require('async_hooks');
const dc = require('diagnostics_channel');
const assert = require('assert');

const channel = dc.channel('corpus-bind');
const direct = new AsyncLocalStorage();
const shaped = new AsyncLocalStorage();

console.log('inactive:', channel.hasSubscribers);
channel.bindStore(direct);
console.log('bound counts as active:', channel.hasSubscribers);
channel.bindStore(shaped, (data) => ({ data }));

channel.subscribe((data) => {
  assert.strictEqual(data, direct.getStore()); // identity through the store
  console.log('subscriber sees:', JSON.stringify(shaped.getStore()));
});

const input = { foo: 'bar' };
const nested = { baz: 'buz' };
const out = channel.runStores(input, function (a, b) {
  console.log('this.tag:', this.tag, 'args:', a, b);
  assert.strictEqual(direct.getStore(), input);
  channel.runStores(nested, () => {
    console.log('nested store:', JSON.stringify(shaped.getStore()));
  });
  console.log('unshadowed:', JSON.stringify(shaped.getStore()));
  return 'stores-result';
}, { tag: 'T' }, 7, 8);
console.log('returned:', out);
console.log('empty after:', direct.getStore(), shaped.getStore());

console.log('unbind:', channel.unbindStore(direct), channel.unbindStore(direct));

// tracingChannel: start-channel stores wrap traceSync's whole body.
const tc = dc.tracingChannel('corpus-bind-tc');
const store = new AsyncLocalStorage();
const context = { step: 'one' };
tc.start.bindStore(store, () => context);
console.log('pre-trace:', store.getStore());
tc.traceSync(() => {
  console.log('traced sees:', store.getStore().step);
});
console.log('post-trace:', store.getStore());
