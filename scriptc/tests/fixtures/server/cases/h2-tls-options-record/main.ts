/* createSecureServer(options, handler) with a RUNTIME options record —
 * the Node-suite spelling (`const options = { key, cert }` built from
 * files) — on BOTH flavors: the ALPN=h2 server whose eager handler is
 * the compat 'request' listener over h2 streams, and the allowHTTP1
 * record picking the HTTP/1.1 compatibility server at runtime. The
 * clients live in-process (the h2 session and the https client), so the
 * whole loop compares from stdout alone. */
import { readFileSync } from "node:fs";
import * as http2 from "node:http2";
import { request } from "node:https";
import type { IncomingMessage } from "node:http";

const cert = readFileSync("tests/fixtures/server/certs/localhost.pem", "utf8");
const key = readFileSync("tests/fixtures/server/certs/localhost-key.pem", "utf8");
const ca = readFileSync("tests/fixtures/server/certs/ca.pem", "utf8");

function phase2(): void {
  // allowHTTP1 in the record: the runtime picks the HTTP/1.1 flavor.
  const options = { allowHTTP1: true, cert, key };
  const server = http2.createSecureServer(options, (req, res) => {
    console.log("S2:", req.method, req.url);
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("http1 compat body");
  });
  server.listen(0, () => {
    const port = server.address().port;
    const req = request({ hostname: "localhost", port, path: "/one", method: "GET", ca, agent: false }, (res: IncomingMessage) => {
      console.log("C2: status", res.statusCode);
      let body = "";
      res.on("data", (chunk: Buffer) => {
        body += chunk.toString("utf8");
      });
      res.on("end", () => {
        console.log("C2: body", body);
        server.close(() => console.log("done"));
      });
    });
    req.end();
  });
}

// The h2 flavor: a runtime record without allowHTTP1, the eager compat
// handler over h2 streams.
const options = { cert, key };
const server = http2.createSecureServer(options, (req, res) => {
  console.log("S1:", req.method, req.url);
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("h2 compat body");
});
server.listen(0, () => {
  const port = server.address().port;
  const client = http2.connect(`https://localhost:${port}`, { ca });
  const req = client.request({ ":path": "/zero" });
  req.setEncoding("utf8");
  let data = "";
  req.on("response", (headers: http2.IncomingHttpHeaders) => {
    console.log("C1: status", headers[":status"]);
  });
  req.on("data", (d: string) => {
    data += d;
  });
  req.on("end", () => console.log("C1: body", data));
  req.on("close", () => {
    client.close();
    server.close(() => phase2());
  });
  req.end();
});
