// The lazy-require idiom: a bare require INSIDE a function body loads the
// module at the first CALL, not at file load — and only once, however many
// times the function runs. A conditional lazy path that never executes
// loads nothing.
'use strict';

console.log('main: start');

function boot() {
  require('./lazy.js');
  console.log('boot ran');
}

/** @param {boolean} go */
function maybeNever(go) {
  if (go) {
    require('./never.js');
  }
  console.log('maybeNever ran', go);
}

console.log('main: before boot');
boot();
boot();
maybeNever(false);
console.log('main: end');
