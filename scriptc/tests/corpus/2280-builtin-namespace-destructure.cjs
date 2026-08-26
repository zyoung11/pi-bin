// Destructuring a builtin NAMESPACE binding (`const crypto =
// require('crypto'); const { createHash } = crypto;`) — test/common/
// crypto.js's idiom: the destructure is pure alias plumbing, so the
// bindings key the same lowering tables as `const { createHash } =
// require('crypto')` and the statement itself emits nothing. Renames
// (`{ createHash: mkHash }`) ride the propertyName, and the namespace
// binding itself keeps working for direct member access.
'use strict';

const crypto = require('crypto');
const path = require('path');

const {
  createHash,
  randomBytes,
} = crypto;

console.log(createHash('sha256').update('abc').digest('hex'));
console.log(randomBytes(8).length);

// The rename form binds the module member under the local name.
const { createHash: mkHash } = crypto;
console.log(mkHash('sha1').update('abc').digest('hex'));

// The namespace binding still answers direct member access alongside
// the destructured aliases.
console.log(crypto.createHash('sha256').update('xyz').digest('hex'));

// A second module through the same shape (posix members are
// platform-stable).
const { join, basename } = path;
console.log(join('a', 'b', 'c.txt'));
console.log(basename('/x/y/z.txt'));
