// Prints at load so the requirer's statement order is observable.
'use strict';

console.log('greeter: init');

/** @param {string} who */
function greet(who) {
  return `hello ${who}`;
}

module.exports = { greet };
