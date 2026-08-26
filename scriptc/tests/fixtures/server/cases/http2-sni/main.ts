/* SNI: http2.createSecureServer with an SNICallback — the portless
 * proxy shape end to end. tls.createSecureContext({ cert, key }) mints
 * per-hostname contexts; the callback answers SYNCHRONOUSLY for
 * localhost (the pre-cached default context — portless's cache path),
 * ASYNCHRONOUSLY for alt.localhost (setTimeout stands in for on-demand
 * cert generation), with an ERROR for fail.localhost (Node destroys the
 * socket silently — 'tlsClientError' with no listener), and with
 * undefined for everything else (the default pair serves). The
 * conditional-spread spelling `...(x ? { SNICallback: x } : {})` is the
 * exact portless proxy.ts line. A Map<string, tls.SecureContext> cache
 * exercises the handle as a map value. */
import { readFileSync } from "node:fs";
import * as http2 from "node:http2";
import * as tls from "node:tls";

const cert = readFileSync("tests/fixtures/server/certs/localhost.pem");
const key = readFileSync("tests/fixtures/server/certs/localhost-key.pem");
const altCert = readFileSync("tests/fixtures/server/certs/alt.pem");
const altKey = readFileSync("tests/fixtures/server/certs/alt-key.pem");

const cache = new Map<string, tls.SecureContext>();
cache.set("localhost", tls.createSecureContext({ cert, key }));

function makeSNICallback(): (
  servername: string,
  cb: (err: Error | null, ctx?: tls.SecureContext) => void
) => void {
  return (servername: string, cb: (err: Error | null, ctx?: tls.SecureContext) => void) => {
    console.log(`sni ${servername}`);
    const cached = cache.get(servername);
    if (cached !== undefined) {
      cb(null, cached); // synchronous: the cache path
      return;
    }
    if (servername === "alt.localhost") {
      setTimeout(() => {
        const ctx = tls.createSecureContext({ cert: altCert, key: altKey });
        cache.set(servername, ctx);
        cb(null, ctx); // asynchronous: the generate-on-demand path
      }, 10);
      return;
    }
    if (servername === "fail.localhost") {
      cb(new Error("no certificate for " + servername));
      return;
    }
    cb(null, undefined); // no context: the default pair serves
  };
}

const sni = makeSNICallback();

const server = http2.createSecureServer({
  allowHTTP1: true,
  cert,
  key,
  ...(sni ? { SNICallback: sni } : {}),
});

server.on("request", (req: http2.Http2ServerRequest, res: http2.Http2ServerResponse) => {
  console.log(`${req.method} ${req.url}`);
  if (req.url === "/quit") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("bye");
    server.close(() => console.log("server closed"));
    return;
  }
  res.writeHead(200, { "content-type": "text/plain" });
  res.end(`host=${req.headers.host}`);
});

server.listen(0, () => {
  console.log("listening");
  process.stderr.write(`PORT ${server.address().port}\n`);
});
