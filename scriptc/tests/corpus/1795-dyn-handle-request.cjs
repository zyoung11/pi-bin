// THE canonical suite shape behind the http wide sweep: an untyped JS
// wrapper (test/common's mustCall silhouette) makes the 'request'
// listener checked-dynamic, so req/res BOX into the checked-dynamic tree as native
// HANDLE values (SCR_DYN_HANDLE — reference identity, no copy) and
// every member use inside the body dispatches at runtime onto the same
// http entry points the static lowerings use: req.method/url/headers
// reads, typeof, res.statusCode assignment and read-back, setHeader
// with a number value (String(n) formatting), writeHead's chaining
// return with a header object, and the dyn client response's
// statusCode/headers/data/end surface.
'use strict';
const http = require('http');

let calls = 0;
function mustCallish(fn) {
  calls++;
  return function() {
    return fn.apply(this, arguments);
  };
}

const server = http.createServer();
server.on('request', mustCallish(function(req, res) {
  console.log('method ' + req.method + ' url ' + req.url);
  console.log('typeof req ' + typeof req + ', typeof res ' + typeof res);
  console.log('server req.statusCode: ' + req.statusCode);
  console.log('accept header: ' + req.headers['accept']);
  res.statusCode = 203;
  console.log('statusCode read-back: ' + res.statusCode);
  res.setHeader('X-Num', 7);
  res.writeHead(203, { 'X-Obj': 'yes' }).end('served:' + req.url);
}));

server.listen(0, '127.0.0.1', mustCallish(function() {
  const port = server.address().port;
  http.get({ host: '127.0.0.1', port: port, path: '/one', headers: { Accept: 'text/probe' } }, mustCallish(function(res) {
    let body = '';
    res.on('data', mustCallish(function(c) { body += c; }));
    res.on('end', mustCallish(function() {
      console.log('client status ' + res.statusCode);
      console.log('x-num: ' + res.headers['x-num'] + ' x-obj: ' + res.headers['x-obj']);
      console.log('body ' + body);
      console.log('wrappers made: ' + (calls >= 5 ? 'several' : 'few'));
      server.close();
    }));
  }));
}));
