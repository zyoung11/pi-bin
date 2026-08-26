// The fixture's stand-in for the suite's test/common index: the ONE member
// countdown.js reaches through `require('./')` — mustCall, the counting
// wrapper (1665's shape). countdown.js itself is the suite file BYTE-EXACT.
'use strict';

let outstanding = 0;

function mustCall(fn) {
  if (typeof fn !== 'function') throw new TypeError('mustCall needs a function');
  outstanding += 1;
  return function (a, b, c) {
    outstanding -= 1;
    return fn(a, b, c);
  };
}

function report() {
  return outstanding === 0 ? 'all mustCall callbacks ran' : `outstanding: ${outstanding}`;
}

module.exports = { mustCall, report };
