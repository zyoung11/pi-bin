'use strict';
let current = 'first';
function bump(v) { current = v; }
module.exports = { bump, get value() { return current; } };
