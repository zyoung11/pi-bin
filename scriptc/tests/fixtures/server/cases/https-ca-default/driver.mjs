// The SERVER side of the setDefaultCACertificates case: a real
// node:https server on the reserved port serving the fixture leaf
// (leaf-only chain, signed by certs/ca.pem — the empty-set request must
// see "unable to verify the first certificate").
import { readFileSync } from "node:fs";
import { createServer } from "node:https";

const port = Number(process.argv[2]);
const cert = readFileSync(new URL("../../certs/localhost.pem", import.meta.url));
const key = readFileSync(new URL("../../certs/localhost-key.pem", import.meta.url));

const server = createServer({ cert, key }, (req, res) => {
  if (req.url === "/ready") {
    res.end("ok");
    return;
  }
  console.log(`driver saw ${req.method} ${req.url}`);
  if (req.url === "/text") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("trusted body");
    return;
  }
  if (req.url === "/quit") {
    res.end("bye");
    server.close(() => console.log("driver closed"));
    return;
  }
  res.writeHead(404, {});
  res.end();
});

// Absorb the deliberate verify-failure handshake (Node emits
// 'tlsClientError'; stay quiet so stdout compares).
server.on("tlsClientError", () => {});

server.listen(port);
