'use strict';
/* The RUNTIME tls options record on the JS entry lane (the Node-suite
 * shape): `const options = { key, cert, ... }` reads its members at
 * runtime — the divergence-66 stance. requestCert: false and
 * rejectUnauthorized are Node's inert-without-client-certs pair (read
 * and dropped), an undocumented key drops exactly like Node drops it,
 * cert/key arrive as Buffers, and tls.connect's record implements
 * port/host/rejectUnauthorized/ca/servername. secureConnect, session
 * (once — the received-ticket event), 'secureConnection', authorized,
 * and authorizationError all ride the checked-dynamic dispatch. */
const fs = require('fs');
const tls = require('tls');

const options = {
  key: fs.readFileSync('tests/fixtures/server/certs/localhost-key.pem'),
  cert: fs.readFileSync('tests/fixtures/server/certs/localhost.pem'),
  requestCert: false,
  rejectUnauthorized: true,
  someUndocumentedKnob: 42,
};
const ca = fs.readFileSync('tests/fixtures/server/certs/ca.pem');

const server = tls.createServer(options);
server.on('secureConnection', (sock) => {
  console.log('S: secureConnection');
  console.log('S: authorized', sock.authorized);
  sock.on('data', (chunk) => {
    sock.end('echo:' + chunk.toString('utf8'));
  });
});

server.listen(0, function() {
  const socket = tls.connect({ port: server.address().port, ca, servername: 'localhost' }, () => {
    const err = socket.authorizationError;
    console.log('C: authorized', socket.authorized);
    console.log('C: authorizationError', err === null ? 'null' : err);
    socket.write('ping');
  });
  let gotSession = false;
  socket.once('session', () => {
    gotSession = true;
  });
  socket.on('secureConnect', () => console.log('C: secureConnect'));
  socket.setEncoding('utf8');
  socket.on('data', (chunk) => console.log('C: data ' + chunk.toString('utf8')));
  socket.on('close', () => {
    console.log('C: got-session', gotSession);
    console.log('C: close');
    server.close();
  });
});
