// The JS lane's string-chunk mode: unannotated 'data' listeners are
// checked-dynamic — chunks box by RUNTIME tag (a string once an encoding
// applies, a Buffer-shaped dyn otherwise, whose .length and [i] answer
// like Node), so the `data += chunk` accumulation idiom works.
'use strict';
const { Readable } = require('stream');

const r = new Readable({ encoding: 'utf8', read() {} });
let data = '';
r.on('data', (chunk) => { data += chunk; });
r.on('end', () => console.log('collected:', data, typeof data));
r.push('aé');
r.push(Buffer.from('øb'));
r.push(null);

const p = new Readable({ read() {} });
p.on('data', (chunk) => {
  console.log('plain len:', chunk.length, 'first byte:', chunk[0]);
});
p.on('end', () => console.log('plain end'));
p.push('xyz');
p.push(null);

// setEncoding in a subclass's flow, and read-side accounting in chars.
class Greek extends Readable {
  constructor() {
    super({ highWaterMark: 4 });
    this.sent = false;
  }
  _read() {
    if (this.sent) {
      this.push(null);
      return;
    }
    this.sent = true;
    this.push(Buffer.from('αβγδ'));
  }
}
const g = new Greek();
g.setEncoding('utf8');
g.on('data', (chunk) => console.log('greek:', chunk, chunk.length));
g.on('end', () => console.log('greek end'));
