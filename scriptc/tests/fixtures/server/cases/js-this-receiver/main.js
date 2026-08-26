/* The ambient-receiver pin (plain JS — the node-suite's canonical shape):
 * Node binds `this` to the emitting handle in listener callbacks, and the
 * mustCall wrapper idiom (`fn.apply(this, arguments)`) forwards it. The
 * listen callback reads this.address(), handler/listener receivers assert
 * identity against the handles (strictEqual over the reference-boxed
 * crossing), and req.setEncoding('utf8') makes 'data' deliver strings. */
'use strict';
const http = require('http');
const assert = require('assert');

function wrap(fn) {
  return function() {
    return fn.apply(this, arguments);
  };
}

const server = http.createServer(function(req, res) {
  assert.strictEqual(this, server);
  console.log('handler this is the server');
  req.setEncoding('utf8');
  let body = '';
  req.on('data', function(chunk) {
    console.log(`chunk type: ${typeof chunk}`);
    body += chunk;
  });
  req.on('end', wrap(function() {
    assert.strictEqual(this, req);
    console.log('end listener this is the req');
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end(`echo:${body}`);
    if (req.url === '/quit') {
      server.close(function() {
        assert.strictEqual(this, server);
        console.log('close cb this is the server');
      });
    }
  }));
});

server.listen(0, wrap(function() {
  assert.strictEqual(this, server);
  const a = this.address();
  console.log(`listen cb this is the server; family ${a.family}; port ok ${a.port > 0}`);
  process.stderr.write(`PORT ${a.port}\n`);
}));
