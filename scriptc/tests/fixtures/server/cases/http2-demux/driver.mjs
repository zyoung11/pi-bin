// Three legs through the demux wrapper: a plain HTTP request (routed to
// the 302 redirecter), a TLS request (routed to the h2 allowHTTP1 server
// — the node:https client speaks HTTP/1.1 to both lanes; Node's server
// takes the connection on its allowHTTP1 path, the compiled one on its
// only path), and the TLS /quit. Connection: close on every leg so the
// wrapper's connection count drains.
import { readFileSync } from "node:fs";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

const port = Number(process.argv[2]);
const ca = readFileSync(new URL("../../certs/ca.pem", import.meta.url));

function plainGet(path) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      { host: "127.0.0.1", port, path, method: "GET", headers: { connection: "close" } },
      (res) => {
        res.resume();
        res.on("end", () => {
          console.log(`driver plain ${path} -> ${res.statusCode} location=${res.headers.location} xp=${res.headers["x-portless"] ?? "-"}`);
          resolve();
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

function tlsGet(path) {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      { host: "127.0.0.1", servername: "localhost", port, path, method: "GET", ca, headers: { connection: "close" } },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          console.log(`driver tls ${path} -> ${res.statusCode} body=${Buffer.concat(chunks).toString("utf8")}`);
          resolve();
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

await plainGet("/dashboard");
await tlsGet("/hello");
await tlsGet("/quit");
console.log("driver done");
