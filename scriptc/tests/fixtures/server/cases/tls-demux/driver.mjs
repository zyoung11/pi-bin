// Four legs, sequential: a dead peer (connect + immediate FIN — the
// read(1)-null arm), a plain HTTP request (routed to the redirecter), a
// TLS request (routed to the https server), and the TLS /quit. Every
// HTTP leg sends Connection: close so the wrapper's connection count
// drains deterministically.
import { readFileSync } from "node:fs";
import { connect as netConnect } from "node:net";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

const port = Number(process.argv[2]);
const ca = readFileSync(new URL("../../certs/ca.pem", import.meta.url));

function deadPeer() {
  return new Promise((resolve) => {
    const sock = netConnect(port, "127.0.0.1");
    sock.on("connect", () => sock.end());
    sock.on("data", () => {});
    sock.on("error", () => {});
    sock.on("close", () => {
      console.log("driver dead-peer closed");
      resolve();
    });
  });
}

function plainGet(path) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      { host: "127.0.0.1", port, path, method: "GET", headers: { connection: "close" } },
      (res) => {
        res.resume();
        res.on("end", () => {
          console.log(`driver plain ${path} -> ${res.statusCode} location=${res.headers.location}`);
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

await deadPeer();
await plainGet("/somewhere");
await tlsGet("/hello");
await tlsGet("/quit");
console.log("driver done");
