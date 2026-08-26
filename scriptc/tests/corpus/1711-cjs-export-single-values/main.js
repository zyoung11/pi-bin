// Single-value `module.exports =` shapes end-to-end: function identifier
// (direct call AND bare value), const identifier, and scalar literals
// (string, negative number after a top-level effect, boolean). Node keeps
// only the LAST replacement — the discarded-first-table rule is exercised
// by the exporter fences, not here (those fence loudly instead).
'use strict';

const double = require('./double');
const kLimit = require('./limit');
const version = require('./version');
const offset = require('./offset');
const enabled = require('./enabled');

console.log('double(21) =', double(21));
const twice = double; // bare-value use: the binding IS the function
console.log('aliased:', twice(4));
console.log('kLimit =', kLimit, '+1 =', kLimit + 1);
console.log('version =', version, 'len =', version.length);
console.log('offset =', offset, 'scaled =', offset * 4);
console.log('enabled =', enabled, 'negated =', !enabled);
