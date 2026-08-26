// Compiled into the binary (it is part of the module graph) but its init
// must never run: Node never loads it either — no output from here.
'use strict';

console.log('skipped: init (must never print)');

// tsc needs SOME export to see a CJS file as a module (TS2306 otherwise);
// an empty table is the neutral side-effect-module spelling.
module.exports = {};
