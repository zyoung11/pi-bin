// CJS export shapes end-to-end: accessor tables read live state per read,
// Proxy-wrapped tables alias through to their target, and replaced-exports
// reads answer undefined — the Node test harness's own module shapes.
'use strict';
const table = require('./table.cjs');
const proxied = require('./proxied.cjs');

console.log('T1', table.value);
table.bump('second');
console.log('T2', table.value);
table.bump('third');
console.log('T3', table.value);

console.log('P1', proxied.double(21));
console.log('P2', proxied.fixed);
console.log('P3', proxied.hits, proxied.hits, proxied.hits); // getter runs per read
console.log('P4', proxied.replacedExportsRead());
