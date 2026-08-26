/* The ALPN split of the h2-over-TLS server, pinned from OUTSIDE by the
 * Node driver: an h2 client negotiates h2 and gets real frames; an
 * http/1.1-ONLY client fails the handshake with no_application_protocol
 * (Node's h2-only server split — divergence 57's retired arm). The
 * server answers every stream and closes on /quit. */
import { readFileSync } from "node:fs";
import * as http2 from "node:http2";

const cert = readFileSync("tests/fixtures/server/certs/localhost.pem", "utf8");
const key = readFileSync("tests/fixtures/server/certs/localhost-key.pem", "utf8");

const server = http2.createSecureServer({ cert, key });
server.on("stream", (stream: http2.ServerHttp2Stream, headers: http2.IncomingHttpHeaders) => {
  const path = headers[":path"] as string;
  console.log("S: stream", path);
  stream.respond({ ":status": 200, "x-served-by": "h2" });
  stream.end(`answer for ${path}`);
  if (path === "/quit") server.close();
});

server.listen(0, () => {
  process.stderr.write(`PORT ${server.address().port}\n`);
});
