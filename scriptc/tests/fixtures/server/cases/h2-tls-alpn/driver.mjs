// The h2-tls-alpn driver: three probes against whichever lane listens.
// 1) Node's http2 client (offers h2 only): must negotiate h2 and get a
//    real HEADERS+DATA answer.
// 2) An http/1.1-only TLS client: must FAIL the handshake with the
//    no_application_protocol alert (both lanes advertise h2 alone).
// 3) A final h2 request to /quit so the server shuts itself down.
import { readFileSync } from "node:fs";
import * as http2 from "node:http2";
import { connect as tlsConnect } from "node:tls";

const port = Number(process.argv[2]);
const ca = readFileSync(new URL("../../certs/ca.pem", import.meta.url));

function h2Get(path) {
  return new Promise((resolve) => {
    const client = http2.connect(`https://localhost:${port}`, { ca });
    const req = client.request({ ":path": path });
    req.setEncoding("utf8");
    let status = 0;
    let served = "";
    let body = "";
    req.on("response", (headers) => {
      status = headers[":status"];
      served = headers["x-served-by"];
    });
    req.on("data", (d) => { body += d; });
    req.on("end", () => {
      console.log(`driver h2 ${path}: ${status} ${served} alpn=${client.alpnProtocol} body=${body}`);
      client.close();
      resolve(undefined);
    });
  });
}

function http1OnlyProbe() {
  return new Promise((resolve) => {
    const sock = tlsConnect({ port, ca, servername: "localhost", ALPNProtocols: ["http/1.1"] }, () => {
      console.log(`driver http1-only UNEXPECTEDLY connected alpn=${sock.alpnProtocol}`);
      sock.end();
      resolve(undefined);
    });
    sock.on("error", (err) => {
      console.log(`driver http1-only error ${err.code}`);
      resolve(undefined);
    });
  });
}

await h2Get("/first");
await http1OnlyProbe();
await h2Get("/quit");
