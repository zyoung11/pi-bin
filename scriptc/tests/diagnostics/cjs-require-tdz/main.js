// A require whose binding IS reachable from code above it: Node would
// throw "Cannot access 'greet' before initialization" at the helper()
// call (the const initializes AT the require), an ordering the compiled
// aliasing does not model — the require keeps a named SC1013 fence.
'use strict';

console.log('boot', helper());
const { greet } = require('./lib.js');

function helper() {
  return greet('early');
}

console.log(helper());
