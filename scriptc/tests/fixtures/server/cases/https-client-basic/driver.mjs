// The SERVER side of the pure https-client case: a real node:https
// server on the reserved port, serving the fixture leaf (leaf-only
// chain — the no-ca request must see "unable to verify the first
// certificate"). Logs what the CLIENT sent on the wire.
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
  console.log(`driver saw ${req.method} ${req.url} host=${req.headers.host !== undefined ? "yes" : "no"} conn=${req.headers.connection}`);
  if (req.url === "/text") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("secure café body");
    return;
  }
  if (req.url === "/chunked") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.write("first ");
    res.write("second ");
    res.end("third");
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

// Absorb handshake failures from the fixture's deliberate no-ca request
// (Node emits 'tlsClientError'; default would just destroy — stay quiet
// so stdout compares).
server.on("tlsClientError", () => {});

server.listen(port);
