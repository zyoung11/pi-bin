/* http2.createSecureServer({ cert, key }) — REAL h2 over TLS: the ALPN
 * answer advertises h2 and the h2 session attaches as the TLS socket's
 * parser (scr_http2.c behind scr_tls.c), so 'stream' listeners, HPACK,
 * multiplexed frames, and the client session all run exactly the h2c
 * machinery after the handshake. The client dials the httpS authority
 * (the TLS client transport offering ALPN ["h2"]), so this one program
 * pins the full loop: scheme, status, body, alpnProtocol, encrypted. */
import { readFileSync } from "node:fs";
import * as http2 from "node:http2";

const cert = readFileSync("tests/fixtures/server/certs/localhost.pem", "utf8");
const key = readFileSync("tests/fixtures/server/certs/localhost-key.pem", "utf8");
const ca = readFileSync("tests/fixtures/server/certs/ca.pem", "utf8");

const server = http2.createSecureServer({ cert, key });
server.on("stream", (stream: http2.ServerHttp2Stream, headers: http2.IncomingHttpHeaders) => {
  console.log("S: path", headers[":path"] === "/abc");
  console.log("S: method", headers[":method"] === "GET");
  console.log("S: scheme-https", headers[":scheme"] === "https");
  stream.respond({ ":status": 200, "content-type": "text/plain" });
  stream.write("hel");
  stream.end("lo");
});

server.listen(0, () => {
  const port = server.address().port;
  const client = http2.connect(`https://localhost:${port}`, { ca });
  const req = client.request({ ":path": "/abc" });
  req.setEncoding("utf8");
  let data = "";
  req.on("response", (headers: http2.IncomingHttpHeaders) => {
    console.log("C: status-200", headers[":status"] === 200);
    console.log("C: ctype", headers["content-type"] === "text/plain");
  });
  req.on("data", (d: any) => { data += d; });
  req.on("end", () => console.log("C: body", data));
  req.on("close", () => {
    console.log("C: alpn", client.alpnProtocol);
    console.log("C: encrypted", client.encrypted);
    client.close();
    server.close();
  });
  req.end();
});
