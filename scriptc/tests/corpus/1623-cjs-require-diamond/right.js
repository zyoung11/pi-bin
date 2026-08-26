// Requires shared BELOW its own print: by the time this runs, shared is
// already cached (left loaded it) — no second init.
'use strict';

console.log('right: init');
const { next } = require('./shared.js');

function rightTick() {
  return `right ${next()}`;
}

module.exports = { rightTick };
