// The CommonJS exporter: a module.exports TABLE — shorthand properties
// (alias plumbing to the declarations above), a renamed property, and an
// expression-valued property (its own export global).
'use strict';

/** @param {number} n */
function double(n) {
  return n * 2;
}

/** @param {string} s @param {number} times */
function repeat(s, times) {
  let out = "";
  for (let i = 0; i < times; i++) out += s;
  return out;
}

const VERSION = "1.2.3";

module.exports = {
  double,
  rep: repeat,
  VERSION,
  bump: (/** @type {number} */ x) => x + 1,
};
