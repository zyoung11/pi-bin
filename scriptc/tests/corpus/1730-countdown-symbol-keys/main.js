// The Node suite's common/countdown.js BYTE-EXACT (symbol-keyed fields:
// `this[kLimit] = limit` where kLimit is a module-level unique-symbol
// const), driven the way suite tests drive it: construct, dec() to zero
// (the mustCall-wrapped callback fires exactly at zero), read the getter,
// and observe the expiry AssertionError once the count is spent. The
// symbol keys lower to ordinary hidden fields — compile-time identities
// need no runtime symbol table.
'use strict';

const Countdown = require('./countdown');
const { report } = require('./');

const c = new Countdown(3, () => console.log('countdown complete'));
console.log('start:', c.remaining);
console.log('dec ->', c.dec());
console.log('dec ->', c.dec());
console.log('dec ->', c.dec());
console.log('end:', c.remaining);
console.log(report());

// Expired: the internal assert on this[kLimit] > 0 throws catchably.
try {
  c.dec();
} catch (err) {
  if (err instanceof Error) console.log('expired:', err.message);
}

// A second instance proves per-instance slots: symbol-keyed storage is
// not shared class state.
const d = new Countdown(2, () => console.log('second complete'));
console.log('d start:', d.remaining, 'c still:', c.remaining);
console.log('d dec ->', d.dec());
console.log('d dec ->', d.dec());
console.log(report());
