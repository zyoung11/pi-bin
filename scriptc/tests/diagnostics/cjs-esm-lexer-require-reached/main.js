// A CommonJS ENTRY has no ESM instantiate phase: the ES module below
// loads at the require(), and ITS named import of a lexer-invisible CJS
// export would make Node throw the missing-export SyntaxError there —
// MID-EVALUATION, after this line already printed. That interleaving is
// not modeled: the invisible import keeps a pointed fence instead of the
// startup-crash lowering the import-reachable graph gets.
'use strict';

console.log('main: start');
const { answer } = require('./mid.mjs');
console.log('main:', answer);
