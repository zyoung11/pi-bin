// The JS lane's process.nextTick shapes: implicit-any callbacks ride the
// checked-dynamic function boundary (the mustCall-wrapper precedent), a
// parameterized callback invoked argument-free sees undefined, and the
// trailing-argument form delivers through the interned dyn thunk.
'use strict';

function logBoth(a, b) {
  console.log('logBoth', a, b);
}

// Trailing arguments: JS call semantics at fire time.
process.nextTick(logBoth, 1, 'two');

// A parameterized callback with NO trailing arguments: each param reads
// undefined, exactly Node's zero-argument invocation.
process.nextTick((x) => {
  console.log('param is', x === undefined ? 'undefined' : String(x));
});

// FIFO across mixed shapes.
process.nextTick(() => console.log('plain tick'));

let n = 0;
const counted = () => {
  n++;
  if (n < 3) process.nextTick(counted);
  else console.log('counted to', n);
};
process.nextTick(counted);
