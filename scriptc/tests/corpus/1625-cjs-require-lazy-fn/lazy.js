'use strict';

console.log('lazy: init');

// tsc needs SOME export to see a CJS file as a module (TS2306 otherwise);
// an empty table is the neutral side-effect-module spelling.
module.exports = {};
