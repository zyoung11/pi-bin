'use strict';

console.log('left: init');
const { next } = require('./shared.js');

function leftTick() {
  return `left ${next()}`;
}

module.exports = { leftTick };
