// The http2-hello driver: three legs.
//
// 1. Plain https/1.1 requests (node:https offers ALPN http/1.1): both
//    lanes serve HTTP/1.1 — status, headers, and body are byte-identical.
// 2. The h2-OFFERING leg: a TLS connection offering ["h2", "http/1.1"].
//    Node's allowHTTP1 server picks h2; the compiled server advertises
//    http/1.1 only, so the client negotiates down (SEMANTICS.md
//    divergence 57). The comparison here is STRUCTURAL by necessity: the
//    negotiated protocol name is NOT printed (it differs by design) —
//    the driver speaks whichever protocol was negotiated and prints what
//    the application sees (status + body), which must be identical.
// 3. /quit over https/1.1 to shut the server down.
//
// Connection: close on every 1.1 request so connections drain.
import { readFileSync } from "node:fs";
import { request as httpsRequest } from "node:https";
import { connect as tlsConnect } from "node:tls";
import { connect as h2Connect } from "node:http2";

const port = Number(process.argv[2]);
const ca = readFileSync(new URL("../../certs/ca.pem", import.meta.url));

function get(path, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        host: "127.0.0.1",
        servername: "localhost",
        port,
        path,
        method: "GET",
        ca,
        headers: { connection: "close", ...extraHeaders },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          console.log(
            `${path} -> ${res.statusCode} ct=${res.headers["content-type"]} xp=${res.headers["x-portless"] ?? "-"} body=${body}`,
          );
          resolve();
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

function alpnGet(path) {
  return new Promise((resolve, reject) => {
    const sock = tlsConnect(
      { host: "127.0.0.1", servername: "localhost", port, ca, ALPNProtocols: ["h2", "http/1.1"] },
      () => {
        if (sock.alpnProtocol === "h2") {
          // Node lane: h2 accepted — speak HTTP/2 over this socket.
          const session = h2Connect(`https://localhost:${port}`, {
            createConnection: () => sock,
          });
          session.on("error", reject);
          const req = session.request({ ":path": path });
          let status = 0;
          const chunks = [];
          req.on("response", (headers) => {
            status = headers[":status"];
          });
          req.on("data", (c) => chunks.push(c));
          req.on("end", () => {
            console.log(`alpn ${path} -> ${status} body=${Buffer.concat(chunks).toString("utf8")}`);
            session.close(resolve);
          });
          req.end();
        } else {
          // Compiled lane: negotiated down to http/1.1 — speak it over
          // the same socket (node:https parses the response).
          const req = httpsRequest(
            {
              createConnection: () => sock,
              path,
              method: "GET",
              headers: { host: "localhost", connection: "close" },
            },
            (res) => {
              const chunks = [];
              res.on("data", (c) => chunks.push(c));
              res.on("end", () => {
                console.log(
                  `alpn ${path} -> ${res.statusCode} body=${Buffer.concat(chunks).toString("utf8")}`,
                );
                resolve();
              });
            },
          );
          req.on("error", reject);
          req.end();
        }
      },
    );
    sock.on("error", reject);
  });
}

await get("/");
await get("/echo-host", { host: "myapp.localhost" });
await alpnGet("/");
await get("/quit");
console.log("driver done");
