/* The h2 compat layer, JS-entry lane: dyn-wrapped handlers (the suite's
 * common.mustCall shape), `this` as the server in a function handler,
 * writeHead's header-object form, empty-string writes, the chaining
 * setEncoding spelling, req 'aborted' + complete/aborted flags, and the
 * forward-captured `const client = connect(url, mustCall(...))` shape. */
'use strict';
const http2 = require('http2');

function mustCall(fn) { return fn; } // the wrapper SHAPE (dyn boundary), not the accounting

let served = 0;
const server = http2.createServer(mustCall(function (request, response) {
  served = served + 1;
  if (served === 1) {
    console.log('S: httpVersion', request.httpVersion);
    console.log('S: complete-before', request.complete);
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.write('1\n');
    response.write('');
    response.write('2\n');
    response.end('3\n');
    return;
  }
  // request 2: the client aborts mid-response (writable side open)
  request.on('aborted', function () {
    console.log('S: aborted-fires', this.aborted === true);
    server.close();
  });
  console.log('S: req2-aborted-flag', request.aborted);
  response.write('hello');
}));

server.listen(0, mustCall(function () {
  const port = this.address().port;
  const client = http2.connect(`http://localhost:${port}`, mustCall(() => {
    const req = client.request({ ':path': '/' }).setEncoding('ascii');
    let res = '';
    req.on('response', mustCall(function (headers) {
      console.log('C: status', headers[':status'] === 200);
      console.log('C: ctype', headers['content-type'] === 'text/plain');
    }));
    req.on('data', (chunk) => { res = res + chunk; });
    req.on('end', mustCall(function () {
      console.log('C: body-1', JSON.stringify(res));
      client.close();
      // the second exchange: abort after the first data chunk
      const client2 = http2.connect(`http://localhost:${port}`, mustCall(() => {
        const req2 = client2.request({ ':path': '/two' });
        req2.on('data', mustCall(() => {
          client2.destroy();
        }));
      }));
    }));
    req.end();
  }));
}));
