// @no-deprecation
// Buffer's invalid-argument ladders, Node-exact: Buffer.compare /
// buf.compare / buf.equals over non-buffer values and bad offsets throw
// ERR_INVALID_ARG_TYPE / ERR_OUT_OF_RANGE with Node's argument names and
// determineSpecificType renders; undefined offset slots take their
// defaults; well-typed calls through the same checked path still compute
// real answers. Plus the deprecated `new Buffer(number, enc)` string-arm
// rejection and the ERR_* codes on the write/swap/fill range ladders.
'use strict';
const show = (fn) => {
  try {
    console.log('ret', fn());
  } catch (e) {
    console.log(`${e.name}|${e.code}|${e.message}`);
  }
};
const a = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
const b = Buffer.from([5, 6, 7, 8, 9, 0, 1, 2, 3, 4]);

// The static form's buf1/buf2 ladder (and the well-typed answer).
show(() => Buffer.compare(Buffer.alloc(1), 'abc'));
show(() => Buffer.compare('abc', Buffer.alloc(1)));
show(() => Buffer.compare(null, Buffer.alloc(1)));
show(() => Buffer.compare(a, b));

// equals: otherBuffer.
show(() => Buffer.alloc(1).equals('abc'));
show(() => Buffer.alloc(1).equals(7));
show(() => a.equals(Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 0])));

// The instance ladder: target first, then each offset slot in order —
// non-numbers ERR_INVALID_ARG_TYPE, non-integers/out-of-range numbers
// ERR_OUT_OF_RANGE (Infinity renders 'an integer'), undefined defaults.
show(() => a.compare());
show(() => a.compare('abc'));
show(() => a.compare(b, '0'));
show(() => a.compare(b, undefined));
show(() => a.compare(b, 0, undefined, 0));
show(() => a.compare(b, 0, null));
show(() => a.compare(b, 0, { valueOf: () => 5 }));
show(() => a.compare(b, Infinity, -Infinity));
show(() => a.compare(b, 0xff));
show(() => a.compare(b, '0xff'));
show(() => a.compare(b, 0, '0xff'));
show(() => a.compare(b, 0, 100, 0));
show(() => a.compare(b, 0, 1, 0, 100));
show(() => a.compare(b, -1));
show(() => a.compare(b, 0, Infinity));
show(() => a.compare(b, 0, 1, -1));
show(() => a.compare(b, -Infinity, Infinity));
show(() => a.compare(b, NaN));
show(() => a.compare(b, 1.5));
show(() => a.compare(b, 6, 10));
show(() => a.compare(b, 6, 10, 0, 0));
show(() => a.compare(b, 0, 0, 0, 0));
show(() => a.compare(b, 0, 5, 4));

// new Buffer(number, encoding): the deprecated ctor's string arm.
show(() => new Buffer(42, 'utf8'));

// The write/swap/fill ladders carry their Node codes.
show(() => Buffer.alloc(9).write('foo', -1));
show(() => Buffer.alloc(9).write('foo', 10));
show(() => Buffer.from('abc').swap16());
show(() => Buffer.alloc(3).fill(Buffer.alloc(0)));
show(() => Buffer.alloc(3).writeUInt8(1, -1));
show(() => Buffer.alloc(3).writeUInt8(256, 0));
show(() => Buffer.alloc(3).writeDoubleLE(1, 1));
show(() => Buffer.alloc(1).readInt16LE(0));
