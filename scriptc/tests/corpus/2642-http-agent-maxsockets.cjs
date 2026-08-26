// REAL maxSockets accounting through an Agent: with maxSockets 1 the
// second request queues (agent.requests[name] holds it) until the first
// exchange finishes, and the counters read exactly Node's at every
// causally-pinned point — sockets[name].length at response time, the
// queue length, and the drained tables afterwards. Socket REUSE is not
// pinned (this client dials one connection per request — the documented
// divergence); only the counters and the strict first-then-second
// ordering are.
'use strict';
const http = require('http');

const agent = new http.Agent({ maxSockets: 1 });
const server = http.createServer(function (req, res) {
  res.end('ok:' + req.url);
});

server.listen(0, function () {
  const port = server.address().port;
  const name = agent.getName({ port: port });
  let done = 0;
  const finish = function () {
    if (++done === 2) {
      console.log('after both: sockets?', name in agent.sockets, 'requests?', name in agent.requests);
      agent.destroy();
      server.close();
    }
  };
  http.get({ port: port, agent: agent, path: '/a' }, function (res) {
    console.log('res1', res.statusCode, 'active:', agent.sockets[name].length, 'queued:', agent.requests[name].length);
    res.resume();
    res.on('end', finish);
  });
  http.get({ port: port, agent: agent, path: '/b' }, function (res2) {
    console.log('res2', res2.statusCode, 'still queued:', name in agent.requests, 'active:', agent.sockets[name].length);
    res2.resume();
    res2.on('end', finish);
  });
});
