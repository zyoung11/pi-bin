// The JS lane's `constructor(options) { super(options); }` forwarding:
// the options record is checked-dynamic, so the option walk runs in the
// RUNTIME (the initDyn twin) — undefined forwards as all defaults, an
// inline record at the new-site rides through the dyn boundary (scalars
// read with Node's rules: highWaterMark, encoding, autoDestroy !== false),
// a non-function callback slot falls back to the prototype's underscore
// method (Node's typeof guard), and an options `read` SHADOWS _read
// (Node's instance-property-over-prototype rule).
'use strict';
const { Readable, Writable } = require('stream');

function identity(fn) {
  return fn;
}

class MyReader extends Readable {
  constructor(options) {
    super(options);
    this.pos = 0;
  }
  _read(n) {
    this.pos++;
    if (this.pos > 2) {
      this.push(null);
      return;
    }
    this.push('chunk' + this.pos);
  }
}

class MyWriter extends Writable {
  constructor(opt) {
    super(opt);
  }
  _write(chunk, enc, cb) {
    console.log('w:', chunk.toString(), enc);
    cb();
  }
}

const a = new MyReader();
const got = [];
a.on('data', (c) => got.push(String(c)));
a.on('end', () => {
  console.log('a:', got.join('|'));
  const b = new MyReader({ encoding: 'utf8', highWaterMark: 5 });
  console.log('b hwm:', b.readableHighWaterMark);
  const gb = [];
  b.on('data', (c) => gb.push(c));
  b.on('end', () => {
    console.log('b:', gb.join('|'));
    const w = new MyWriter({ write: 1, highWaterMark: 3 });
    console.log('w hwm:', w.writableHighWaterMark);
    w.write('www');
    w.end(() => {
      console.log('w done');
      // The options `read` SHADOWS _read through the dyn walk; the value
      // rides as a checked-dynamic function (the mustCall shape — typed
      // closures cannot ride a record's dyn conversion yet).
      const shadowRead = () => {
        shadowed.push(null);
      };
      const shadowed = new MyReader({ read: identity(shadowRead) });
      shadowed.resume();
      shadowed.on('end', () => console.log('shadowed end (options read wins)'));
    });
  });
});
