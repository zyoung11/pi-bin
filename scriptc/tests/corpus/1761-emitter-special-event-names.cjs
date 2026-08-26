// Special event names — strings that are Object.prototype member names
// ('__proto__', 'toString', '__defineGetter__', 'hasOwnProperty'). The
// compiler's own lookup tables are plain object literals keyed by
// user-written names, so a bare `TABLE[event]` used to find INHERITED
// members: `{ SIGINT: 2 }["__proto__"]` answered Object.prototype, which
// flowed into a numLit and emitted `[object Object]` into the C
// (test-event-emitter-special-event-names.js). Every user-keyed lookup now
// goes through own(); these names must behave as ordinary event names.
'use strict';
const EventEmitter = require('events');
const { Readable } = require('stream');

const ee = new EventEmitter();
ee.on('__proto__', (v) => { console.log('proto', v); });
ee.on('toString', (v) => { console.log('tostring', v); });
ee.on('__defineGetter__', (v) => { console.log('getter', v); });
ee.on('hasOwnProperty', (v) => { console.log('hop', v); });
ee.emit('__proto__', 1);
ee.emit('toString', 2);
ee.emit('__defineGetter__', 3);
ee.emit('hasOwnProperty', 4);
console.log(ee.eventNames().join(','));
console.log(ee.listenerCount('__proto__'));

// A stream is the other special-name space: the per-base FORCED event
// tables ('data', 'end', ...) used an `in` test, and `'toString' in
// { data: ... }` answers true through the prototype chain — the listener
// would have been typed by Object.prototype.toString's "tuple".
const r = new Readable({ read() {} });
r.on('toString', (v) => { console.log('stream tostring', v); });
r.emit('toString', 5);
r.on('end', () => { console.log('end'); });
r.push(null);
r.resume();
