// A JS file-scope const whose initializer is a wrapper call and whose
// callback references the binding ITSELF (`const exec = wrap(() => ...
// exec ...)`) — the Node-suite mustCall + setTimeout re-arm idiom: the
// binding registers as a checked-dynamic global BEFORE the initializer
// lowers, so the self-capture resolves.
'use strict';

function wrap(fn) {
  return function (...args) { return fn.apply(this, args); };
}

let count = 3;
const exec = wrap(() => {
  console.log('tick', count);
  if (--count === 0) return;
  setTimeout(exec, 1);
});
exec();

// The same shape through a subscription-style callback that removes
// itself by reference.
const seen = [];
let handler = null;
function fire(v) { if (handler) handler(v); }
const once = wrap((v) => {
  seen.push(v);
  handler = null;
});
handler = once;
fire('a');
fire('b');
process.on('exit', () => console.log('seen', seen.join(',')));
