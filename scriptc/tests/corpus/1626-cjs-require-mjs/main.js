// require() of an ES module (Node's require(esm)): the module graph under
// it — base.mjs via mid's hoisted import — evaluates at the require
// statement, below the requirer's earlier output.
'use strict';

console.log('main: start');
const { four } = require('./mid.mjs');
console.log('main:', four());
