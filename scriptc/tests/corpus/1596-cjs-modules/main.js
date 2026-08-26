// The CommonJS importer: destructured require (renames included), the
// whole-module namespace binding with member reads and calls, a directory
// require ('./common' → common/index.js), and a side-effect-free re-require
// (Node's module cache — state is shared, never re-initialized).
'use strict';

const { double, rep, VERSION } = require('./lib.js');
const lib = require('./lib.js');
const common = require('./common');

console.log(double(21), rep("ab", 3), VERSION);
console.log(lib.double(4), lib.bump(41), lib.VERSION);
console.log(common.record("first"), common.GREETING);
console.log(common.record("second"));

const again = require('./common');
console.log(again.record("third"));
