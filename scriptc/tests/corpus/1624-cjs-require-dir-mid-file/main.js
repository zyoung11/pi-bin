// A DIRECTORY require ('./common' → common/index.js) below observable
// statements, plus a cache-hit re-require even further down.
'use strict';

console.log('main: banner');
const common = require('./common');
console.log(common.record('first'), common.GREETING);
console.log('main: between');
const again = require('./common');
console.log(again.record('second'));
