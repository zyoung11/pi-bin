// `module.exports = <function identifier>`: the required binding IS the
// function — direct calls and bare-value uses (map callbacks) both work.
'use strict';

function double(n) {
  return n * 2;
}

module.exports = double;
