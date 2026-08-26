// The SECOND require of a module is a cache hit wherever it appears: same
// exports object, shared state, no re-initialization — even when both
// requires sit below other observable statements.
'use strict';

console.log('main: start');
const a = require('./counter.js');
console.log('first handle', a.bump(), a.bump());
console.log('between requires');
const b = require('./counter.js');
console.log('second handle continues', b.bump());
console.log('first handle sees it too', a.bump());
