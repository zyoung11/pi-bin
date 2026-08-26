/* Handshake failures as portless observes them: no 'tlsClientError'
 * listener, so a failed handshake tears the socket down SILENTLY (Node's
 * default). The driver throws plain-TCP garbage and a wrong-CA client at
 * the server — the server's stdout must stay silent for both, then serve
 * the one good connection. */
import { readFileSync } from "node:fs";
import { createServer } from "node:tls";

const cert = readFileSync("tests/fixtures/server/certs/localhost.pem");
const key = readFileSync("tests/fixtures/server/certs/localhost-key.pem");

const server = createServer({ cert, key }, (sock) => {
  console.log("secure connection");
  sock.on("data", (chunk) => {
    const text = chunk.toString("utf8");
    console.log(`data ${text}`);
    if (text === "quit") {
      sock.end("bye");
      server.close(() => console.log("server closed"));
    }
  });
  sock.on("close", () => console.log("close"));
});

server.listen(0, () => {
  console.log("listening");
  process.stderr.write(`PORT ${server.address().port}\n`);
});
