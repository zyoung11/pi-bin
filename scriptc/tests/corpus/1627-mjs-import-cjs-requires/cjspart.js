// The CJS half: requires an ES module BELOW its first statement — Node
// runs base's body right here, between the two prints.
'use strict';

console.log('cjspart: start');
const { two } = require('./base.mjs');
console.log('cjspart: after require');

module.exports = { six: two() * 3 };
