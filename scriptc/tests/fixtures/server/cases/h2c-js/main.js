/* The JS-lane h2c loop: a common.mustCall-shaped wrapper makes the
 * listeners checked-dynamic (the Node-suite shape), so the stream and
 * session handles cross into dyn code and dispatch their members through
 * the h2 dyn handle ops. Self-contained; stdout compared across lanes. */
'use strict';

function mustCall(fn) {
  return function (...args) { return fn.apply(this, args); };
}

const http2 = require('http2');
const server = http2.createServer();
server.on('stream', mustCall((stream, headers) => {
  console.log('S: path', headers[':path']);
  stream.respond({ ':status': 201, 'content-type': 'text/plain' });
  stream.end('hello');
}));

server.listen(0, mustCall(() => {
  const client = http2.connect(`http://localhost:${server.address().port}`);
  const req = client.request({ ':path': '/js' });
  req.setEncoding('utf8');
  let data = '';
  req.on('response', mustCall((h) => { console.log('C: status', h[':status']); }));
  req.on('data', (d) => { data += d; });
  req.on('end', mustCall(() => { console.log('C: body', data); }));
  req.on('close', () => { client.close(); server.close(); });
}));
