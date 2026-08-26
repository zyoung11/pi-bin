// `module.exports = <class identifier>` end-to-end: the required binding IS
// the class — construct it, call methods that mutate checked-dynamic fields
// (`--this.limit` in expression position included), read the getter.
'use strict';

const Countdown = require('./countdown');

const c = new Countdown(3, () => console.log('countdown complete'));
console.log('start:', c.remaining);
console.log('dec →', c.dec());
console.log('dec →', c.dec());
console.log('dec →', c.dec());
console.log('end:', c.remaining);

// Postfix on a checked-dynamic field yields the OLD value.
const d = new Countdown(2, () => console.log('second complete'));
console.log('postfix read:', d.limit--, 'then:', d.remaining);
console.log('dec →', d.dec());
