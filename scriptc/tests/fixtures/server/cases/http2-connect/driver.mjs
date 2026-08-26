// The http2-connect driver: an ordinary GET (the server works), then an
// HTTP/1.1 CONNECT over TLS — the listener's socket arm destroys the
// connection: the client sees a close with ZERO response bytes on both
// lanes. ALPN pins http/1.1 so Node's lane speaks the same protocol the
// compiled lane serves.
import { readFileSync } from "node:fs";
import { request as httpsRequest } from "node:https";
import { connect as tlsConnect } from "node:tls";

const port = Number(process.argv[2]);
const ca = readFileSync(new URL("../../certs/ca.pem", import.meta.url));

function get(path) {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        host: "127.0.0.1",
        servername: "localhost",
        port,
        path,
        method: "GET",
        ca,
        headers: { connection: "close" },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          console.log(`${path} -> ${res.statusCode} body=${Buffer.concat(chunks).toString("utf8")}`);
          resolve();
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

function connectLeg() {
  return new Promise((resolve, reject) => {
    const sock = tlsConnect(
      { host: "127.0.0.1", servername: "localhost", port, ca, ALPNProtocols: ["http/1.1"] },
      () => {
        sock.write("CONNECT example.com:443 HTTP/1.1\r\nHost: example.com:443\r\n\r\n");
        let bytes = 0;
        sock.on("data", (c) => (bytes += c.length));
        sock.on("close", () => {
          console.log(`connect leg closed, response bytes=${bytes}`);
          resolve();
        });
      },
    );
    sock.on("error", reject);
  });
}

await get("/");
await connectLeg();
await get("/quit");
console.log("driver done");
