// Requires BELOW other top-level statements: Node evaluates each module's
// body AT the require statement, interleaved with the requirer's own
// effects — the guarded run-once %init lowering must reproduce the exact
// print order, including the transitive require inside status.js and the
// cache-hit re-require at the end.
'use strict';

console.log('main: start');
const { greet } = require('./greeter.js');
console.log('main: after greeter', greet('a'));
const status = require('./status.js');
console.log('main: after status', status.ping());
require('./greeter.js');
console.log('main: end', status.ping());
