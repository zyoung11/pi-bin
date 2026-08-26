// A require diamond evaluated mid-file: main loads left (which loads
// shared), prints, then loads right (whose require of shared is a cache
// hit). The single shared counter proves one instance serves all three.
'use strict';

console.log('main: start');
const { leftTick } = require('./left.js');
console.log(leftTick());
console.log('main: middle');
const { rightTick } = require('./right.js');
console.log(rightTick(), leftTick());
