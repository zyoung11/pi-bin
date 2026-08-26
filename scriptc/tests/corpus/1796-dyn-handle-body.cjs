// The dyn handle BODY surface and identity semantics: a POST body
// accumulated through dyn req.on('data'/'end') listeners (Buffer-
// flavored chunks — `body += c` decodes utf8 like Node), handle
// identity across boxes (req === req, and the box riding two different
// listener captures is still one JS object), res.end's callback form
// (fires deferred, Node's 'finish' emit), headersSent/writableEnded
// read-backs around end, and req.pipe(res) — the echo leg — on a
// second exchange.
'use strict';
const http = require('http');

function wrap(fn) {
  return function() {
    return fn.apply(this, arguments);
  };
}

const server = http.createServer();
server.on('request', wrap(function(req, res) {
  if (req.url === '/echo') {
    res.writeHead(200, { 'X-Leg': 'pipe' });
    req.pipe(res);
    return;
  }
  let body = '';
  const same = req;
  req.on('data', wrap(function(c) { body += c; }));
  req.on('end', wrap(function() {
    console.log('identity held: ' + (same === req));
    console.log('server body: ' + body);
    console.log('headersSent before: ' + res.headersSent + ' ended before: ' + res.writableEnded);
    res.statusCode = 201;
    res.end('got:' + body, wrap(function() {
      console.log('end callback fired');
    }));
    console.log('headersSent after: ' + res.headersSent + ' ended after: ' + res.writableEnded);
  }));
}));

function post(port, path, payload, cb) {
  const out = http.request({ host: '127.0.0.1', port: port, path: path, method: 'POST' }, wrap(function(res) {
    let body = '';
    res.on('data', wrap(function(c) { body += c; }));
    res.on('end', wrap(function() { cb(res.statusCode, body); }));
  }));
  out.end(payload);
}

server.listen(0, '127.0.0.1', wrap(function() {
  const port = server.address().port;
  post(port, '/collect', 'ping-pong', function(status, body) {
    console.log('collect leg: ' + status + ' ' + body);
    post(port, '/echo', 'straight-through', function(status2, body2) {
      console.log('echo leg: ' + status2 + ' ' + body2);
      server.close();
    });
  });
}));
