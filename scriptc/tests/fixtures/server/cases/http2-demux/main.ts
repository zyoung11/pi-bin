/* Portless's TLS-enabled proxy listener, verbatim shape (proxy.ts): an
 * http2 allowHTTP1 secure server and a plain-http redirecter behind a
 * net wrapper that peeks the first byte — 0x16 (a TLS ClientHello)
 * routes to the h2 server via emit("connection"), anything else to the
 * redirecter. The h2 server serves HTTP/1.1 on every connection
 * (SEMANTICS.md divergence 57); the redirect leg answers 302 with a
 * Location. Byte-pinned against Node with TLS and plain first bytes. */
import { readFileSync } from "node:fs";
import * as http from "node:http";
import * as http2 from "node:http2";
import * as net from "node:net";

const cert = readFileSync("tests/fixtures/server/certs/localhost.pem");
const key = readFileSync("tests/fixtures/server/certs/localhost-key.pem");

const h2Server = http2.createSecureServer({
  cert,
  key,
  allowHTTP1: true,
});
h2Server.on("sessionError", () => {});
/* isEncrypted, portless-verbatim (proxy.ts): the cast-refined encrypted
 * read — true on TLS-transported sockets, undefined on plain ones. */
function isEncrypted(req: http.IncomingMessage): boolean {
  return !!(req.socket as net.Socket & { encrypted?: boolean }).encrypted;
}

h2Server.on("request", (req: http2.Http2ServerRequest, res: http2.Http2ServerResponse) => {
  req.stream?.on("error", () => {});
  console.log(`secure ${req.method} ${req.url} enc=${isEncrypted(req as unknown as http.IncomingMessage)}`);
  if (req.url === "/quit") {
    res.end("bye");
    h2Server.close();
    wrapper.close(() => console.log("wrapper closed"));
    return;
  }
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("proxied over tls");
});

/* The response header portless stamps on every proxy answer — its 302
 * uses the COMPUTED-key spelling over this const, which lowers because
 * the key's type is the string literal. */
const PORTLESS_HEADER = "X-Portless";

const plain = http.createServer((req, res) => {
  console.log(`plain ${req.method} ${req.url} enc=${isEncrypted(req)}`);
  res.writeHead(302, { Location: `https://localhost${req.url}`, [PORTLESS_HEADER]: "1" });
  res.end();
});

const wrapper = net.createServer((socket) => {
  socket.on("error", () => socket.destroy());
  socket.once("readable", () => {
    const buf = socket.read(1);
    if (buf === null) {
      socket.destroy();
      return;
    }
    socket.unshift(buf);
    if (buf[0] === 0x16) {
      console.log("route tls");
      h2Server.emit("connection", socket);
    } else {
      console.log("route plain");
      plain.emit("connection", socket);
    }
  });
});

wrapper.listen(0, () => {
  console.log("listening");
  process.stderr.write(`PORT ${wrapper.address().port}\n`);
});
