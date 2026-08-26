// The diamond's tip: initialized once, at the FIRST require that reaches
// it (inside left.js), with one shared counter for everyone.
'use strict';

console.log('shared: init');

let n = 0;

function next() {
  n += 1;
  return n;
}

module.exports = { next };
