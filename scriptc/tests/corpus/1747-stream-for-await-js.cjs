// The JS lane's for-await: dyn chunks box by runtime tag — strings once
// an encoding applies, Buffer-shaped dyns otherwise — so accumulation
// (`res += chunk`), chunk.toString(), and typeof all answer like Node;
// Readable.from arrays iterate element-per-chunk in a subclass pipeline.
'use strict';
const { Readable, Transform } = require('stream');

class Upper extends Transform {
  _transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase());
  }
}

async function main() {
  let res = '';
  for await (const chunk of Readable.from(['x', 'y', 'z'])) res += chunk;
  console.log('from:', res, typeof res);

  const r = new Readable({ read() {} });
  r.push('hello');
  r.push(null);
  for await (const chunk of r) {
    console.log('typeof:', typeof chunk, 'len:', chunk.length, 'str:', chunk.toString());
  }

  const e = new Readable({ encoding: 'utf8', read() {} });
  e.push('éncoded ');
  e.push(Buffer.from('tail'));
  e.push(null);
  let enc = '';
  for await (const chunk of e) enc += chunk;
  console.log('encoded:', enc);

  // a subclass Transform in between: write side fed by a from() loop
  const t = new Upper();
  const feed = async () => {
    for await (const chunk of Readable.from(['ab', 'cd'])) t.write(chunk.toString());
    t.end();
  };
  feed();
  let up = '';
  for await (const chunk of t) up += chunk;
  console.log('upper:', up);
  console.log('done');
}
main();
