// The JS lane's underscore-method assignment shapes: implicit-any
// callbacks lower against the option-callback tuples (chunks arrive as
// Buffers), and a function VALUE rides the checked-dynamic boundary — the
// mustCall-wrapper precedent (`this` is undefined there; the lexical
// binding reaches the stream).
'use strict';
const { Readable, Writable } = require('stream');

const r = new Readable();
let n = 0;
r._read = function (size) {
  n++;
  if (n === 1) console.log('read size is number:', typeof size === 'number');
  if (n <= 2) this.push('r' + n);
  else this.push(null);
};
const got = [];
r.on('data', (c) => got.push(c.toString()));
r.on('end', () => {
  console.log('js read got', got.join('+'));

  // A function VALUE (not inline): the checked-dynamic boundary path.
  const seen = [];
  const myWrite = (chunk, encoding, cb) => {
    seen.push(String(chunk));
    cb();
  };
  const w = new Writable();
  w._write = myWrite;
  w.write('a');
  w.write('b');
  w.end(() => console.log('js wrote', seen.join('+')));
});
