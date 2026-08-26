// The JS lane's checked-dynamic listeners: unannotated parameters register
// through the dyn-converting adapter (emit arguments box to dyn; extra
// parameters read undefined, extra arguments are ignored — JS-exact),
// while the ORIGINAL keeps the entry's identity for removeListener and
// listenerCount(name, fn). Non-function listeners throw Node's exact
// ERR_INVALID_ARG_TYPE TypeError, catchably.
'use strict';
const EventEmitter = require('events');
const ee = new EventEmitter();

ee.on('x', (a) => { console.log('arrow got', a, typeof a); });
ee.emit('x', 5);

function handler(a, b) { console.log('handler got', a, b); }
ee.on('y', handler);
ee.emit('y', 'str', 7);
console.log(ee.listenerCount('y', handler));
ee.removeListener('y', handler);
console.log(ee.listenerCount('y'));
ee.emit('y', 'gone', 0);

// A wrapper factory: each wrap is a fresh identity (mustCall's shape).
const wrap = (fn) => (a, b) => { fn(a, b); };
const once1 = wrap((a, b) => { console.log('once got', a, b); });
ee.once('z', once1);
ee.emit('z', 1, 2);
ee.emit('z', 3, 4);
console.log('count z', ee.listenerCount('z'));

// Extra parameters past the emitted tuple read undefined.
ee.on('extra', (a, b, c) => { console.log('extra', a, b, c); });
ee.emit('extra', 42, 'two');

// Zero-parameter listeners ignore every argument.
ee.on('zero', () => { console.log('zero-param ok'); });
ee.emit('zero', 9, 9);

// prepend/off through the dyn path.
const first = () => { console.log('first'); };
const second = () => { console.log('second'); };
ee.on('order', first);
ee.prependListener('order', second);
ee.emit('order');
ee.off('order', second);
ee.emit('order');

// Node's registration-family listener validation, byte for byte.
for (const bad of [5, null, 'oops', true]) {
  try {
    ee.on('bad', bad);
  } catch (e) {
    const er = /** @type {{code: string, message: string, name: string}} */ (e);
    console.log(er.name, er.code, er.message);
  }
}
console.log('done');
