// pipeline()'s stage validation ladder: a provably-non-stream value in
// any stage position (source, middle, destination) answers Node's
// makeAsyncIterable ERR_INVALID_ARG_TYPE — the "body" clause, identical
// in every position — thrown synchronously before anything registers.
// Numbers, booleans, null, and pair-less plain objects take the ladder;
// strings, arrays, and { readable, writable } records are VALID pipeline
// inputs in Node (iterables / the duplex-pair form) and keep the fence
// instead, so they never appear here. finished(null) joins finished()'s
// narrower isNodeStream ladder (2599 pins the other shapes). A real
// pipeline runs last to show the ladder left the lowered path intact.
'use strict';
const { pipeline, finished, PassThrough } = require('stream');
const show = (fn) => { try { fn(); console.log('ok'); } catch (e) { console.log(`${e.name}|${e.code}|${e.message}`); } };

// source position
show(() => { pipeline(42, new PassThrough(), () => {}); });
show(() => { pipeline(null, new PassThrough(), () => {}); });
show(() => { pipeline(true, new PassThrough(), () => {}); });
show(() => { pipeline({ nope: 1 }, new PassThrough(), () => {}); });

// middle position — same "body" clause
show(() => { pipeline(new PassThrough(), 42, new PassThrough(), () => {}); });
show(() => { pipeline(new PassThrough(), null, new PassThrough(), () => {}); });

// destination position — same "body" clause
show(() => { pipeline(new PassThrough(), { nope: 1 }, () => {}); });
show(() => { pipeline(new PassThrough(), false, () => {}); });

// finished()'s isNodeStream ladder renders null too
show(() => { finished(null, () => {}); });

// the lowered path still pipes
const src = new PassThrough();
const dst = new PassThrough();
dst.on('data', (c) => console.log(`piped:${c}`));
pipeline(src, dst, (err) => console.log(`done:${err ? err.code : 'null'}`));
src.end('flow');
