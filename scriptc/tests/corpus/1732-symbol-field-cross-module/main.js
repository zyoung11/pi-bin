// Cross-module symbol keys: the key const lives in timer.js and travels
// through the CJS export table; `t[kTicks]` HERE aliases to the same
// unique-symbol declaration, so the read/write is the same hidden field
// the class declared — one identity, one slot, across modules.
'use strict';

const { inspect } = require('util');
const { Timer, kTicks } = require('./timer');

const t = new Timer(7);
console.log('start:', t[kTicks]);
console.log('tick ->', t.tick());
t[kTicks] = 100;
console.log('after external write:', t.tick());
console.log(inspect(t));
