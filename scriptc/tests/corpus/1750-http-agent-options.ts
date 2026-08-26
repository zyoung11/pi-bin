// The options-record stance on the http client: agent: false LOWERS (a
// one-shot dial sending Connection: close — Node's own header for it, and
// the compiled client's connection model either way), agent: null states
// the default (the keep-alive request header), and an UNDOCUMENTED option
// key with a side-effect-free value drops exactly like Node drops it.
// The server reads back the connection header each exchange, so the wire
// bytes are the assertion. Strict ping-pong: one exchange in flight at a
// time, every line causally ordered.
import { createServer, request, get } from "node:http";

const server = createServer((req, res) => {
  const conn = req.headers["connection"];
  console.log(`srv ${req.url} connection=${conn !== undefined ? conn : "-"}`);
  res.end(`echo:${req.url}`);
});

function readBody(tag: string, res: import("node:http").IncomingMessage, done: () => void): void {
  let body = "";
  res.on("data", (chunk: Buffer) => {
    body += chunk.toString("utf8");
  });
  res.on("end", () => {
    console.log(`${tag} status=${res.statusCode !== undefined ? res.statusCode : -1} body=${body}`);
    done();
  });
}

server.listen(0, () => {
  const port = server.address().port;
  // agent: false → the request head says Connection: close (both lanes).
  const one = request({ hostname: "127.0.0.1", port, path: "/one", agent: false }, (res) => {
    readBody("cli /one", res, () => {
      // agent: null → the default agent's keep-alive header; the bogus
      // keys (identifier, literal, closure) are undocumented and DROP —
      // Node ignores them the same way.
      const zorp = 7;
      get(
        { hostname: "127.0.0.1", port, path: "/two", agent: null, zorp, wibble: "x", onNothing: () => 1 },
        (res2) => {
          readBody("cli /two", res2, () => {
            // agent: false composes with a literal headers option — the
            // injected pair joins the user's headers.
            const three = request(
              { hostname: "127.0.0.1", port, path: "/three", method: "POST", agent: false, headers: { "x-tag": "t3" } },
              (res3) => {
                readBody("cli /three", res3, () => {
                  server.close();
                });
              },
            );
            three.end("payload");
          });
        },
      );
    });
  });
  one.end();
});
