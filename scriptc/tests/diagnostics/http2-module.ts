/* The http2 compatibility slice's fences (the module itself lowers now —
 * SEMANTICS.md divergence 57): createSecureServer WITHOUT allowHTTP1:
 * true is an h2-only server, which has no lowering; the h2-only request
 * members (stream, session) COMPILE in call position — guarded ?. calls
 * no-op, unguarded calls throw Node's exact TypeError (stream is
 * undefined on every HTTP/1.1 connection, in Node too) — but CONSUMING
 * a call's result fences (it could only ever be undefined), as does a
 * bare stream/session read outside a call; and the unlowered module
 * members fence with the hint naming the fallback. */
import { readFileSync } from "node:fs";
import * as http2 from "node:http2";

const cert = readFileSync("cert.pem");
const key = readFileSync("key.pem");

// h2-only server: lowers for real (h2 over TLS, ALPN advertises h2 alone).
http2.createSecureServer({ cert, key });

const server = http2.createSecureServer({ allowHTTP1: true, cert, key });
server.on("request", (req, res) => {
  // Consuming the always-undefined call result: the pointed fence (the
  // statement forms — guarded and unguarded — compile; see the server
  // differential's http2-hello).
  const r = req.stream.on("error", () => {});
  res.end("x");
});
server.listen(0);
