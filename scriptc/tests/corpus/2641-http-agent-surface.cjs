// The http.Agent surface: construction with options, getName's exact
// string shapes (host/port/localAddress/family/socketPath arms), the
// option properties (maxSockets Infinity default, maxFreeSockets,
// protocol, settable defaultPort), a request THROUGH the agent (the
// sockets/requests tables key by getName; freeSockets stays empty — no
// pooling exists), and destroy(). The default-port merge: an agent
// carrying defaultPort dials it when the request omits port. Causally
// ordered, one exchange at a time.
'use strict';
const http = require('http');

const agent = new http.Agent();
console.log('getName():', agent.getName());
console.log('getName({}):', agent.getName({}));
console.log('getName(full):', agent.getName({ host: '0.0.0.0', port: 80, localAddress: '192.168.1.1' }));
console.log('getName(family4):', agent.getName({ family: 4 }));
console.log('getName(sockPath):', agent.getName({ socketPath: '/tmp/x.sock' }));
console.log('maxSockets:', agent.maxSockets, 'maxFreeSockets:', agent.maxFreeSockets);
console.log('protocol:', agent.protocol, 'keepAlive:', agent.keepAlive);

const server = http.createServer(function (req, res) {
  res.end('ok:' + req.url);
});

server.listen(0, function () {
  const port = server.address().port;
  agent.defaultPort = port;
  console.log('defaultPort set:', agent.defaultPort === port);
  const name = agent.getName({ port: port });
  // No port option: the agent's defaultPort dials (Node's option merge).
  http.get({ host: 'localhost', agent: agent, path: '/merged' }, function (res) {
    console.log('status:', res.statusCode);
    console.log('sockets has name:', name in agent.sockets, 'len:', agent.sockets[name].length);
    console.log('requests has name:', name in agent.requests);
    console.log('freeSockets empty:', JSON.stringify(agent.freeSockets));
    let body = '';
    res.on('data', function (c) { body += c.toString('utf8'); });
    res.on('end', function () {
      console.log('body:', body);
      agent.destroy();
      server.close();
    });
  });
});
