'use strict';
// The 1615 proxied shape, imported instead of required: the RHS is not a
// literal and not require(...), so the lexer detects nothing at all.
const seven = 7;
const table = {
  double(x) { return x * 2; },
  fixed: seven,
};
module.exports = new Proxy(table, {});
