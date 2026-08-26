// The Node-test-suite shape: require('./common') resolves to this
// directory index. Loads once, mid-file in the requirer.
'use strict';

console.log('common: init');

let calls = 0;

/** @param {string} what */
function record(what) {
  calls += 1;
  return `${what}#${calls}`;
}

module.exports = { record };
module.exports.GREETING = 'hi from common';
