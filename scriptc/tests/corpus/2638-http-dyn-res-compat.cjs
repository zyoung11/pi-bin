// The ServerResponse compat members on CHECKED-DYNAMIC handles (the
// untyped-wrapper listener boxes req/res into the dyn): setHeader
// chaining + getHeaders snapshots, flushHeaders, the raw-array writeHead
// form (per-name override of setHeader state, other names survive),
// cork/uncork with the writableCorked counter (corked writes coalesce and
// flush on the last uncork), write-with-encoding ('hex' decodes the
// string chunk), the deferred write/end callbacks, res.req identity, and
// the destroyed flags (false at work time, true inside 'close').
// Strict ping-pong: one exchange at a time, every line causally ordered.
'use strict';
const http = require('http');

function wrap(fn) {
  return function () {
    return fn.apply(this, arguments);
  };
}

const server = http.createServer();
server.on('request', wrap(function (req, res) {
  console.log('srv', req.url, 'req.destroyed:', req.destroyed, 'req.readable:', req.readable);
  res.setHeader('a', '1');
  console.log('setHeader chains:', res.setHeader('b', '2') === res);
  console.log('getHeaders:', JSON.stringify(res.getHeaders()));
  if (req.url === '/raw') {
    res.writeHead(200, ['test', '9', 'b', 'override']);
    res.end('raw');
    return;
  }
  if (req.url === '/cork') {
    res.writeHead(200);
    console.log('corked0:', res.writableCorked);
    res.cork();
    res.write('AA');
    res.cork();
    res.write('BB');
    console.log('corked2:', res.writableCorked);
    res.uncork();
    res.uncork();
    console.log('corked-after:', res.writableCorked, 'finished:', res.writableFinished);
    res.end('CC', wrap(function () {
      console.log('end cb, finished:', res.writableFinished);
    }));
    return;
  }
  if (req.url === '/hex') {
    res.writeHead(200);
    res.write('414243', 'hex', wrap(function () {
      console.log('write cb ran');
    }));
    res.end();
    return;
  }
  console.log('res.req is req:', res.req === req);
  res.flushHeaders();
  console.log('headersSent after flushHeaders:', res.headersSent);
  res.on('close', wrap(function () {
    console.log('res close, destroyed:', res.destroyed);
  }));
  res.end('done');
}));

function get(path, done) {
  http.get({ port: server.address().port, path: path }, wrap(function (res) {
    let body = '';
    res.on('data', wrap(function (c) {
      body += c.toString('utf8');
    }));
    res.on('end', wrap(function () {
      console.log(path, '->', res.statusCode, JSON.stringify(body),
                  'test:', res.headers.test, 'a:', res.headers.a, 'b:', res.headers.b);
      done();
    }));
  }));
}

server.listen(0, function () {
  get('/plain', function () {
    get('/raw', function () {
      get('/cork', function () {
        get('/hex', function () {
          server.close();
        });
      });
    });
  });
});
