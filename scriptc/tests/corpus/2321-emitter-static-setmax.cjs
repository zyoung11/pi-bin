// The EventEmitter class-VALUE surface: `EventEmitter.setMaxListeners(n)`
// is the STATIC (Node writes events.defaultMaxListeners after
// validateNumber(n, "setMaxListeners", 0)), a different function from the
// instance member — the instance dispatch used to conflate the two and
// hand the instance libCall the class value (the setMax receiver ICE).
// The no-target number form lowers for real: fresh emitters see the new
// default; negative/NaN throw Node's catchable ERR_OUT_OF_RANGE.
'use strict';
const events = require('events');
const { EventEmitter } = events;

const before = new events.EventEmitter();
console.log('default-before', before.getMaxListeners());

EventEmitter.setMaxListeners(21);
const after = new events.EventEmitter();
console.log('default-after', after.getMaxListeners());

// An instance pinned BEFORE the write keeps answering the live default
// (no per-emitter cap was ever set on it) — Node's own fallback read.
console.log('pre-existing', before.getMaxListeners());

// The validation: negatives throw catchably (NaN takes the same runtime
// path, but NaN the GLOBAL has no lowering yet — its own fence), and the
// default is untouched.
for (const bad of [-1, -2.5]) {
  try {
    EventEmitter.setMaxListeners(bad);
    console.log('SHOULD NOT RUN');
  } catch (e) {
    console.log(e.name, e.code, e.message);
  }
}
console.log('default-still', new events.EventEmitter().getMaxListeners());

// The instance member on a real emitter still rides the per-emitter cap.
const e = new events.EventEmitter();
e.setMaxListeners(3);
console.log('instance-cap', e.getMaxListeners(), 'default-unmoved', new events.EventEmitter().getMaxListeners());
