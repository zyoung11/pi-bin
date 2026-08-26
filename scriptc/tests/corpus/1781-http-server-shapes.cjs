// The JS-lane server shapes the Node suite spells: http.Server as a
// factory CALL and under `new` (both are createServer), the late
// server.on('request') handler, listen(port, host, callback) with the
// positional bind address, and checked-dynamic callbacks — an untyped
// wrapper function (test/common's mustCall shape) whose result lands in
// the listen-callback and listener slots, adapting through the dynCheck
// function boundary (zero-arg slots, plus the data/end/error payloads
// that box into dynamic values).
'use strict';
const http = require('http');

let wrapped = 0;
function wrap(fn) {
  wrapped++;
  return function() {
    return fn.apply(this, arguments);
  };
}

const viaCall = http.Server(function(req, res) {
  res.writeHead(200).end('call-form');
});

const viaNew = new http.Server();
viaNew.on('request', function(req, res) {
  res.end('new-form');
});

// (port, path, close, done) — the server stays behind a zero-arg close
// thunk: opaque handles do not box into untyped JS parameters.
function fetchThen(port, path, close, done) {
  const req = http.get({ host: '127.0.0.1', port: port, path: path }, function(res) {
    let body = '';
    res.on('data', wrap(function(chunk) {
      body += chunk.toString('utf8');
    }));
    res.on('end', wrap(function() {
      console.log(path + ' -> ' + body);
      close();
      done();
    }));
  });
  req.on('error', wrap(function(err) {}));
}

viaCall.listen(0, '127.0.0.1', wrap(function() {
  console.log('call-form listening');
  fetchThen(viaCall.address().port, '/call', function() { viaCall.close(); }, function() {
    viaNew.listen(0, wrap(function() {
      console.log('new-form listening, wrappers made: ' + (wrapped >= 4 ? 'several' : 'few'));
      fetchThen(viaNew.address().port, '/new', function() { viaNew.close(); }, function() {
        console.log('done');
      });
    }));
  });
}));
