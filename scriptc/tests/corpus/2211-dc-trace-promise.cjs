// dc.tracingChannel.tracePromise — Node's reaction choreography: start/end
// publish synchronously around the traced call, asyncStart/asyncEnd run
// one microtask later with ctx.result stamped by the resolve reaction
// (end sees NO result — deepStrictEqual(found, input) holds there), the
// rejection path stamps ctx.error and publishes error before the async
// pair, thisArg binds for the traced call, the returned promise settles
// with the passed-through outcome, and the no-subscriber early exit skips
// every publish — even when the promise settles after a later subscribe
// (`new Promise(setImmediate)` resolves on the immediate queue).
'use strict';
const dc = require('diagnostics_channel');
const assert = require('assert');

const tc = dc.tracingChannel('corpus-tp');
let events = [];
const handlers = {
  start: (m) => { events.push(`start result=${m.result === undefined ? '-' : m.result}`); },
  end: (m) => { events.push(`end result=${m.result === undefined ? '-' : m.result}`); },
  asyncStart: (m) => { events.push(`asyncStart result=${m.result}`); },
  asyncEnd: (m) => { events.push(`asyncEnd result=${m.result}`); },
  error: (m) => { events.push(`error msg=${m.error.message}`); },
};

// Early exit: traced before any subscriber exists — the settle after
// subscribe still publishes nothing.
tc.tracePromise(() => new Promise(setImmediate), {});

tc.subscribe(handlers);

const thisArg = { who: 'corpus' };
tc.tracePromise(function (v) {
  console.log('traced this.who =', this.who);
  return Promise.resolve(v);
}, {}, thisArg, 42).then((v) => {
  console.log('fulfilled with', v);
  console.log(events.join(' | '));
  events = [];

  // The rejection path: error publishes (stamped), then the async pair,
  // and the returned promise rejects with the SAME reason object.
  const boom = new Error('tp boom');
  tc.tracePromise((r) => Promise.reject(r), {}, undefined, boom).catch((e) => {
    assert.strictEqual(e, boom); // identity through the whole choreography
    console.log('rejected identity ok:', e.message);
    console.log(events.join(' | '));
  });
});

console.log('sync tail:', events.join(' | '));
