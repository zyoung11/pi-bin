// Conditional requires at the top level: Node loads a module only when the
// require actually EVALUATES. The taken branch initializes its module in
// place; the untaken branch's module stays silent; a second conditional
// require of the taken module is a cache hit.
'use strict';

console.log('main: start');
const n = 3;
if (n > 2) {
  require('./taken.js');
}
if (n > 5) {
  require('./skipped.js');
}
console.log('main: between');
if (n === 3) {
  require('./taken.js');
}
console.log('main: end');
