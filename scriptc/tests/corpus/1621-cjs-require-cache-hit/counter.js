// One shared instance behind Node's module cache: state persists across
// every require, and the load-time print happens exactly once.
'use strict';

console.log('counter: init');

let hits = 0;

function bump() {
  hits += 1;
  return hits;
}

module.exports = { bump };
