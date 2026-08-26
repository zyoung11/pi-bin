// Checked-dynamic VALUES in option-callback slots (the common.mustCall
// shape): a wrapper's return value lands in `read`/`write`, adapts
// through the dyn-function boundary, and the emitted thisless thunk
// boxes each position by kind — the chunk as bytes, the encoding as
// 'buffer', the completion callback as a callable dyn reporting to the
// runtime. Shorthand `{ read }` rides the same path.
'use strict';
const { Readable, Writable } = require('stream');

function wrap(fn) {
  let calls = 0;
  return function (a, b, c) {
    calls++;
    console.log('wrapped:', calls);
    return fn(a, b, c);
  };
}

let fed = false;
const r = new Readable({
  read: wrap(() => {
    if (!fed) {
      fed = true;
      r.push('dyn-chunk');
      r.push(null);
    }
  }),
});
r.on('data', (c) => console.log('data:', c.toString()));
r.on('end', () => console.log('end'));

const w = new Writable({
  write: wrap((chunk, enc, cb) => {
    console.log('w:', chunk.toString(), enc);
    cb();
  }),
});
w.write('first');
w.end('last', () => console.log('finished'));

const read = (size) => {
  short.push(null);
};
const short = new Readable({ read });
short.resume();
short.on('end', () => console.log('short end'));
console.log('sync');
