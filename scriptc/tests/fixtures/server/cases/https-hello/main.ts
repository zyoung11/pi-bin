/* http-hello over TLS: https.createServer({ cert, key }, handler) — the
 * http server behind a handshake; url/method/headers/framing are the
 * same lowered surface. */
import { readFileSync } from "node:fs";
import { createServer } from "node:https";

const cert = readFileSync("tests/fixtures/server/certs/localhost.pem");
const key = readFileSync("tests/fixtures/server/certs/localhost-key.pem");

const server = createServer({ cert, key }, (req, res) => {
  console.log(`${req.method} ${req.url}`);
  if (req.url === "/quit") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("bye");
    server.close(() => console.log("server closed"));
    return;
  }
  if (req.url === "/plain") {
    res.setHeader("content-type", "text/plain");
    res.end("plain body");
    return;
  }
  res.setHeader("x-portless", "1");
  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  res.end("héllo över tls 😀");
});

server.listen(0, () => {
  console.log("listening");
  process.stderr.write(`PORT ${server.address().port}\n`);
});
