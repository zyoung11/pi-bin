// node:diagnostics_channel tracingChannel — the five-event-channel
// collection: per-event channel names and hasSubscribers, subscribe/
// unsubscribe over a handlers object (unsubscribe's all-found answer),
// traceSync's publish choreography (start/end with result stamping on the
// context object, error + rethrow on the throw path), traceCallback's
// wrapped-callback choreography (error/result then asyncStart/asyncEnd
// around the original callback, setImmediate as a first-class value), and
// the collection-form constructor over five explicit channels.
'use strict';
const dc = require('diagnostics_channel');
const assert = require('assert');

const tc = dc.tracingChannel('corpus');
console.log(tc.start.name, tc.end.name, tc.asyncStart.name, tc.asyncEnd.name, tc.error.name);
console.log(tc.hasSubscribers, tc.start.hasSubscribers);

let events = [];
const handlers = {
  start: (m) => { events.push(`start step=${m.step}`); },
  end: (m) => { events.push(`end step=${m.step} result=${m.result === undefined ? '-' : m.result}`); },
  asyncStart: (m) => { events.push(`asyncStart result=${m.result}`); },
  asyncEnd: (m) => { events.push(`asyncEnd result=${m.result}`); },
  error: (m) => { events.push(`error msg=${m.error.message}`); },
};

tc.subscribe(handlers);
console.log(tc.hasSubscribers, tc.start.hasSubscribers, tc.error.hasSubscribers);

// traceSync success: start sees the context, end sees the stamped result.
const ctx1 = { step: 'one' };
const r1 = tc.traceSync(() => 41 + 1, ctx1);
console.log('r1', r1);
console.log(events.join(' | '));
events = [];

// traceSync throw: error publishes with the thrown error stamped, end
// still fires (the finally), and the throw propagates to the caller.
const boom = new Error('sync boom');
try {
  tc.traceSync(() => { throw boom; }, { step: 'two' });
  console.log('unreachable');
} catch (e) {
  console.log('caught', e.message);
  assert.strictEqual(e, boom); // one error object, one dyn identity
  console.log('rethrow identity ok');
}
console.log(events.join(' | '));
events = [];

// traceCallback: the wrapped callback publishes result then asyncStart/
// asyncEnd around the original; setImmediate crosses as a VALUE.
const done = (err, res) => {
  console.log('cb', err, res);
  console.log(events.join(' | '));

  // unsubscribe answers the all-found conjunction: true the first time,
  // false once the handlers are gone.
  console.log(tc.unsubscribe(handlers), tc.unsubscribe(handlers));
  console.log(tc.hasSubscribers);

  // The collection form: five explicit channels behave identically.
  const coll = dc.tracingChannel({
    start: dc.channel('tracing:corpus2:start'),
    end: dc.channel('tracing:corpus2:end'),
    asyncStart: dc.channel('tracing:corpus2:asyncStart'),
    asyncEnd: dc.channel('tracing:corpus2:asyncEnd'),
    error: dc.channel('tracing:corpus2:error'),
  });
  console.log(coll.start.name, coll.hasSubscribers);

  // A non-function callback slot throws Node's TypeError when subscribers
  // exist — subscribe one first.
  coll.subscribe({ start: () => {} });
  assert.throws(() => coll.traceCallback(() => {}, 0, {}, null, 'not-a-fn'), {
    name: 'TypeError',
    code: 'ERR_INVALID_ARG_TYPE',
  });
  console.log('bad-callback threw');
};
tc.traceCallback(setImmediate, 0, { step: 'three' }, null, done, null, 'res-three');
