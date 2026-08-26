/* server.on("connect", ...) — HTTP CONNECT tunneling on the h2 compat
 * server, portless's proxy.ts shape verbatim: the listener types its
 * second argument `Http2ServerResponse | net.Socket`, narrows with
 * `instanceof net.Socket` (always the socket arm under allowHTTP1 —
 * classic CONNECT destroys), and the extended-CONNECT branch — DEAD at
 * runtime on both lanes here — carries the whole RFC 8441 bridge:
 * req.stream calls (undefined members — the throwing precedent),
 * proxySocket.pipe(res), req.pipe(proxySocket), proxyRes.pipe(res), the
 * headers spread, headersSent, and proxyReq.destroyed. Compiling it IS
 * the test; the driver pins the live arm (CONNECT → socket close). */
import { readFileSync } from "node:fs";
import * as http from "node:http";
import * as http2 from "node:http2";
import * as net from "node:net";

const cert = readFileSync("tests/fixtures/server/certs/localhost.pem");
const key = readFileSync("tests/fixtures/server/certs/localhost-key.pem");

const server = http2.createSecureServer({ allowHTTP1: true, cert, key });

function handleExtendedConnect(req: http2.Http2ServerRequest, res: http2.Http2ServerResponse): void {
  req.stream.on("error", () => {});
  const proxyReq = http.request({
    createConnection: () => net.connect(9, "127.0.0.1"),
    path: req.url,
    method: "GET",
  });
  proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
    const responseHeaders: http.OutgoingHttpHeaders = { ...proxyRes.headers };
    res.writeHead(200, responseHeaders);
    if (proxyHead.length > 0) {
      res.write(proxyHead);
    }
    proxySocket.pipe(res);
    req.pipe(proxySocket);
    const cleanup = () => {
      proxySocket.destroy();
      req.stream.destroy();
    };
    proxySocket.on("error", cleanup);
    proxySocket.on("close", cleanup);
    req.stream.on("close", cleanup);
  });
  proxyReq.on("response", (proxyRes) => {
    proxyRes.on("error", () => req.stream.destroy());
    proxyRes.pipe(res);
  });
  proxyReq.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(502, { "content-type": "text/plain" });
      res.end("Bad Gateway\n");
    } else {
      req.stream.destroy();
    }
  });
  req.stream.on("close", () => {
    if (!proxyReq.destroyed) {
      proxyReq.destroy();
    }
  });
  proxyReq.end();
}

server.on("request", (req: http2.Http2ServerRequest, res: http2.Http2ServerResponse) => {
  console.log(`${req.method} ${req.url}`);
  if (req.url === "/quit") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("bye");
    server.close(() => console.log("server closed"));
    return;
  }
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("ok");
});

server.on(
  "connect",
  (
    req: http2.Http2ServerRequest | http.IncomingMessage,
    resOrSocket: http2.Http2ServerResponse | net.Socket
  ) => {
    console.log("connect seen");
    // With allowHTTP1, an HTTP/1.1 CONNECT fires this same event with a
    // (req, socket, head) signature. Classic CONNECT tunneling is not
    // supported on either protocol version.
    if (resOrSocket instanceof net.Socket) {
      resOrSocket.destroy();
      return;
    }
    handleExtendedConnect(req as http2.Http2ServerRequest, resOrSocket);
  }
);

server.listen(0, () => {
  console.log("listening");
  process.stderr.write(`PORT ${server.address().port}\n`);
});
