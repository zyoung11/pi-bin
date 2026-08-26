// The _readableState/_writableState scalar READS (a read-only compat
// view over the real runtime state): the suite's asserts check lengths,
// flags, and the flowing tri-state through these internals. Writes and
// object-valued members (pipes, buffered entries) keep their fences.
'use strict';
const { Readable, Writable } = require('stream');

let fed = false;
const r = new Readable({
  read() {
    if (!fed) {
      fed = true;
      this.push('abcde');
    }
  },
});
console.log('flowing0:', String(r._readableState.flowing));
console.log('len0:', r._readableState.length, 'hwm:', r._readableState.highWaterMark);
console.log('ended0:', r._readableState.ended, 'endEmitted0:', r._readableState.endEmitted);
r.on('data', (c) => {
  console.log('data:', c.toString(), 'flowing:', String(r._readableState.flowing));
  r.push(null);
});
r.on('end', () => {
  console.log('ended:', r._readableState.ended, 'endEmitted:', r._readableState.endEmitted);
  runW();
});

function runW() {
  const w = new Writable({
    write(chunk, enc, cb) {
      setTimeout(() => cb(), 1);
    },
    highWaterMark: 3,
  });
  console.log('w len0:', w._writableState.length, 'needDrain0:', w._writableState.needDrain);
  w.write('xxxx');
  console.log('w len1:', w._writableState.length, 'needDrain1:', w._writableState.needDrain);
  console.log('w ended1:', w._writableState.ended, 'finished1:', w._writableState.finished);
  w.end(() => {
    console.log('w ended2:', w._writableState.ended, 'finished2:', w._writableState.finished);
    console.log('w corked:', w._writableState.corked, 'buffered:', w._writableState.bufferedRequestCount);
  });
}
console.log('sync');
