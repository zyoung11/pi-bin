// A dependency that itself requires an ALREADY-LOADED module mid-file:
// Node's cache makes that require a no-op — no second greeter init.
'use strict';

console.log('status: init');
require('./greeter.js');

let pings = 0;

function ping() {
  pings += 1;
  return `pong ${pings}`;
}

module.exports = { ping };
