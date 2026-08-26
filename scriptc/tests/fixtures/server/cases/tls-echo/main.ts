/* net-echo over TLS: tls.createServer({ cert, key }, handler) — the
 * handler is 'secureConnection' (fires post-handshake) and the socket
 * then behaves exactly like a net socket. The committed fixture certs
 * (tests/fixtures/server/certs, 100-year validity) keep both lanes off
 * the system trust store; paths are cwd-relative (the harness runs both
 * lanes from the repo root). */
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
    } else {
      sock.write(`echo:${text}`);
    }
  });
  sock.on("end", () => console.log("end"));
  sock.on("close", () => console.log("close"));
});

server.listen(0, () => {
  console.log("listening");
  process.stderr.write(`PORT ${server.address().port}\n`);
});
