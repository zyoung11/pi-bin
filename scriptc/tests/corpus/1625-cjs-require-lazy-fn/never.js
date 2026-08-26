'use strict';

console.log('never: init (must never print)');

// tsc needs SOME export to see a CJS file as a module (TS2306 otherwise);
// an empty table is the neutral side-effect-module spelling.
module.exports = {};
