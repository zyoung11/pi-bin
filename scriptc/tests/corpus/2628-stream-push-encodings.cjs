// Readable string-push encodings: the defaultEncoding option governs how
// push(string) decodes chunks (Buffer.from(chunk, enc)), an explicit
// per-call literal (utf8 included) overrides it, and an unknown spelling
// is Node's runtime ERR_UNKNOWN_ENCODING TypeError — at construction for
// the option, at the call for push. A JS entry so the unknown spellings
// reach the runtime ladder (TS would reject them at the type gate).
// Node is the oracle.
'use strict';
const { Readable } = require('node:stream');

// The option: push('ab') under defaultEncoding 'hex' is ONE byte.
const r = new Readable({ read() {}, defaultEncoding: 'hex' });
r.push('ab');
r.push('0f10');
r.on('data', (c) => console.log('hex-decoded', c.length, c.toString('hex')));

// The explicit per-call encoding overrides the default (utf8 included).
const r2 = new Readable({ read() {}, defaultEncoding: 'hex' });
r2.push('xy', 'utf-8');
r2.push('4142', 'base64');
r2.on('data', (c) => console.log('override', c.length, c.toString('hex')));

// Explicit encodings work without any default too.
const r3 = new Readable({ read() {} });
r3.push('QUJD', 'base64');
r3.on('data', (c) => console.log('base64', c.toString('utf8')));

// Unknown spellings: the option throws at construction, push at the call.
try {
  new Readable({ read() {}, defaultEncoding: 'not-a-thing' });
} catch (err) {
  console.log('ctor-throw', err.name, err.code, err.message);
}
try {
  r3.push('zz', 'nope');
} catch (err) {
  console.log('push-throw', err.name, err.code, err.message);
}
