/* http2.createSecureServer({ allowHTTP1: true, cert, key }) — the
 * compatibility slice (SEMANTICS.md divergence 57): the https server
 * created handler-less, the handler arriving via on("request"), plus the
 * portless shapes around it — the as-cast tuning spread (accepted as
 * literals, ignored: no h2 session exists to tune), the 'sessionError'
 * no-op registration (never fires — no h2 session exists to error), and
 * the guarded h2-only member call req.stream?.on(...) (stream is
 * undefined on every HTTP/1.1 connection, in Node and here — the chain
 * short-circuits). The DRIVER pins the protocol story: a plain https/1.1
 * client is byte-identical across lanes, and an h2-offering client
 * negotiates h2 under Node but http/1.1 here — the driver compares what
 * the application sees (status + body), which IS identical. */
import { readFileSync } from "node:fs";
import * as http2 from "node:http2";

const cert = readFileSync("tests/fixtures/server/certs/localhost.pem");
const key = readFileSync("tests/fixtures/server/certs/localhost-key.pem");

const server = http2.createSecureServer({
  allowHTTP1: true,
  cert,
  key,
  ...({ streamResetBurst: 10000, streamResetRate: 100 } as Record<string, unknown>),
});

server.on("sessionError", () => {});

server.on("request", (req: http2.Http2ServerRequest, res: http2.Http2ServerResponse) => {
  req.stream?.on("error", () => {});
  console.log(`${req.method} ${req.url}`);
  if (req.url === "/quit") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("bye");
    server.close(() => console.log("server closed"));
    return;
  }
  if (req.url === "/echo-host") {
    // getRequestHost's shape (portless proxy.ts): the :authority pseudo-
    // header first — always absent on HTTP/1.1 connections, in Node and
    // here — then Host (the driver pins it to a portless value).
    const authority = req.headers[":authority"];
    const host = authority !== undefined ? authority : req.headers.host;
    res.writeHead(200, { "content-type": "text/plain" });
    res.end(`host=${host === undefined ? "-" : host}`);
    return;
  }
  res.setHeader("x-portless", "1");
  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  res.end("hello from the compat server");
});

server.listen(0, () => {
  console.log("listening");
  process.stderr.write(`PORT ${server.address().port}\n`);
});
