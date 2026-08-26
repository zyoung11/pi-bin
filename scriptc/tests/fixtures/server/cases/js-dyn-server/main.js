/* The keep-alive dyn-binding pin: `let server; server = createServer(...)`
 * puts the netServer HANDLE into an untyped binding (boxed by reference —
 * SCR_DYNH_NET_SERVER). listen/close/address dispatch through the handle
 * ops from closures the checker cannot narrow; the response body rides
 * setEncoding on the client side. */
'use strict';
const http = require('http');

let server;
let hits = 0;
server = http.createServer(function(req, res) {
  hits += 1;
  console.log(`hit ${hits} listening=${server.listening}`);
  res.end(`pong ${hits}`);
  if (req.url === '/quit') {
    server.close(function() {
      console.log(`closed listening=${server.listening}`);
    });
  }
});

server.listen(0, function() {
  const a = server.address();
  console.log(`up family=${a.family} portok=${a.port > 0}`);
  process.stderr.write(`PORT ${a.port}\n`);
});
