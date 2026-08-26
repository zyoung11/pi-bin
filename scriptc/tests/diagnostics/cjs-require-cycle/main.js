// A require cycle: Node hands B the PARTIAL exports of A mid-init, a
// partially-initialized-module observation the export-global model cannot
// represent — cycles keep the named SC1016 fence.
'use strict';

console.log('main: start');
const { A } = require('./a.js');
console.log(A);
