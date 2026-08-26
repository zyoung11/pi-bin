// The Node-test-suite shape: require('./common') resolves to this
// directory index; members are attached to module.exports one by one.
'use strict';

let calls = 0;

/** @param {string} what */
function record(what) {
  calls += 1;
  return `${what}#${calls}`;
}

module.exports = { record };
module.exports.GREETING = "hi from common";
