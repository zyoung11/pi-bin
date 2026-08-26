// The emittedReadable flag's Node-exact lifecycle: a 'readable' listener
// observes TRUE during the emit (emitReadable_ clears it only AFTER a
// real emit), read() with a nonzero/absent size resets it (Node's
// `if (n !== 0)` — the absent form is NaN there, which also clears), and
// read(0) leaves it standing.
'use strict';
const { Readable } = require('stream');

const r = new Readable({ read: () => {} });
r.on('readable', () => {
  console.log('readable-fires', r._readableState.emittedReadable);
  const c = r.read();
  console.log('after-read', c === null ? 'null' : c.toString(), r._readableState.emittedReadable);
});
r.push('abc');
r.push(null);
r.on('end', () => console.log('end'));

const noRead = new Readable({ read: () => {} });
noRead.on('readable', () => {
  console.log('noRead-fires', noRead._readableState.emittedReadable);
  noRead.read(0);
  console.log('after-read0', noRead._readableState.emittedReadable);
});
noRead.push('foo');
noRead.push(null);
