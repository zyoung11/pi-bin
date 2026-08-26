// IncomingMessage flow control on checked-dynamic handles: req.pause()
// holds 'data' delivery (the buffered bytes drain on resume(), off the
// resuming stack) AND defers 'end' until the drain; the client response
// reads readable/destroyed (true until 'end', destroyed only at
// teardown). The timings are causal, not raced: the pause happens on the
// first delivered chunk, the resume 30ms later, and the request's final
// chunk lands 60ms in — after the resume, so the body always reassembles
// complete.
'use strict';
const http = require('http');

function wrap(fn) {
  return function () {
    return fn.apply(this, arguments);
  };
}

const server = http.createServer();
server.on('request', wrap(function (req, res) {
  let got = '';
  let paused = false;
  req.on('data', wrap(function (c) {
    got += c.toString('utf8');
    if (!paused) {
      paused = true;
      console.log('pausing after first chunk:', got.length >= 4);
      req.pause();
      setTimeout(wrap(function () {
        console.log('resuming');
        req.resume();
      }), 30);
    }
  }));
  req.on('end', wrap(function () {
    console.log('server end, body:', JSON.stringify(got));
    res.end('ok');
  }));
}));

server.listen(0, function () {
  const r = http.request({ port: server.address().port, method: 'POST', path: '/' }, wrap(function (res) {
    console.log('res.readable pre:', res.readable, 'destroyed pre:', res.destroyed);
    res.resume();
    res.on('end', wrap(function () {
      console.log('res.readable post:', res.readable);
      server.close();
    }));
  }));
  r.write('abcd');
  setTimeout(function () { r.end('efghij'); }, 60);
});
