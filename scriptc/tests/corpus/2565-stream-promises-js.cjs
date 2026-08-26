// stream/promises through the CommonJS spellings the JS lane uses: the
// destructured require and the bare specifier (no node: prefix), with
// dynamic (JSDoc-free) stream callbacks riding the checked-dynamic lane.
'use strict';
const { Readable, Writable } = require('stream');
const { pipeline, finished } = require('stream/promises');

async function main() {
  const out = [];
  const src = new Readable({ read() {} });
  const dst = new Writable({
    write(chunk, enc, cb) {
      out.push(chunk.toString());
      cb();
    },
  });
  src.push('a');
  src.push('b');
  src.push(null);
  await pipeline(src, dst);
  console.log('pipe:', out.join('+'));

  const r = new Readable({ read() {} });
  const done = finished(r);
  r.destroy(new Error('gone'));
  try {
    await done;
  } catch (e) {
    console.log('finished:', e.message);
  }
}

main();
