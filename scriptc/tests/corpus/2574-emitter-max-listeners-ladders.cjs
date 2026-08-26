// The max-listeners argument ladders, Node-exact: setMaxListeners over a
// non-number throws ERR_INVALID_ARG_TYPE with the rendered Received
// tail, negatives/NaN throw validateNumber's ERR_OUT_OF_RANGE, the
// module-property assignment names its own slot (defaultMaxListeners),
// the qualified static names setMaxListeners, and valid values apply.
'use strict';
const events = require('events');
const e = new events.EventEmitter();
const show = (fn) => {
  try {
    console.log('ret', fn());
  } catch (err) {
    console.log(`${err.name}|${err.code}|${err.message}`);
  }
};

show(() => { e.setMaxListeners(NaN); });
show(() => { e.setMaxListeners(-1); });
show(() => { e.setMaxListeners('and even this'); });
show(() => { e.setMaxListeners(null); });
show(() => { e.setMaxListeners(42); });
console.log(e.getMaxListeners());

show(() => { events.defaultMaxListeners = NaN; });
show(() => { events.defaultMaxListeners = -1; });
show(() => { events.defaultMaxListeners = 'and even this'; });
show(() => { events.defaultMaxListeners = 20; });
console.log(events.defaultMaxListeners);

show(() => { events.EventEmitter.setMaxListeners(NaN); });
show(() => { events.EventEmitter.setMaxListeners('nope'); });
show(() => { events.EventEmitter.setMaxListeners(11); });
console.log(events.defaultMaxListeners);
