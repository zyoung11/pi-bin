// The netSocket half of the HANDLE crossing: an untyped wrapper makes
// the connection listener checked-dynamic, the accepted socket boxes by
// reference, and the body drives the real socket surface — write/end
// with string and dyn chunks, destroyed/writable property reads,
// remoteAddress presence, data/end/close listener registration through
// runtime-built adapters, and String(socket)'s Object.prototype answer.
'use strict';
const net = require('net');

function wrap(fn) {
  return function() {
    return fn.apply(this, arguments);
  };
}

const server = net.createServer(wrap(function(socket) {
  console.log('typeof socket: ' + typeof socket + ', string form: ' + String(socket));
  console.log('destroyed: ' + socket.destroyed + ', writable: ' + socket.writable);
  console.log('remote is loopback: ' + (socket.remoteAddress === '127.0.0.1'));
  socket.on('data', wrap(function(c) {
    console.log('server saw: ' + c);
    socket.write('echo:');
    socket.end(c);
  }));
  socket.on('close', wrap(function() {
    console.log('server socket closed, destroyed now: ' + socket.destroyed);
    server.close();
  }));
}));

server.listen(0, '127.0.0.1', wrap(function() {
  const client = net.connect(server.address().port, '127.0.0.1');
  let got = '';
  client.on('data', function(c) { got += c.toString('utf8'); });
  client.on('end', function() {
    console.log('client got: ' + got);
    client.end();
  });
  client.write('marbles');
}));
