/* tls.connect — the TLS client socket, all three verification arms in
 * one self-contained program (the test-tls-client-reject shape):
 *   A) rejectUnauthorized: false against a self-signed server — the
 *      handshake stands, authorized answers false and authorizationError
 *      the code STRING (DEPTH_ZERO_SELF_SIGNED_CERT), data echoes;
 *   B) the default (verify) against the same server — the client socket
 *      errors with Node's exact self-signed message;
 *   C) ca-anchored against the CA-signed cert — authorized true,
 *      authorizationError null.
 * The callback fires at secureConnect timing in both lanes. Certs are
 * the committed fixture pair (cwd-relative; the harness runs both lanes
 * from the repo root). */
import { readFileSync } from "node:fs";
import * as tls from "node:tls";

const selfCert = readFileSync("tests/fixtures/server/certs/selfsigned.pem", "utf8");
const selfKey = readFileSync("tests/fixtures/server/certs/selfsigned-key.pem", "utf8");
const caCert = readFileSync("tests/fixtures/server/certs/localhost.pem", "utf8");
const caKey = readFileSync("tests/fixtures/server/certs/localhost-key.pem", "utf8");
const ca = readFileSync("tests/fixtures/server/certs/ca.pem", "utf8");

const server1 = tls.createServer({ cert: selfCert, key: selfKey }, (sock) => {
  sock.on("data", (chunk) => {
    sock.end(`echo:${chunk.toString("utf8")}`);
  });
});

const server2 = tls.createServer({ cert: caCert, key: caKey }, (sock) => {
  sock.on("data", (chunk) => {
    sock.end(`echo:${chunk.toString("utf8")}`);
  });
});

function armC(port2: number): void {
  const socket = tls.connect({ port: port2, ca, servername: "localhost" }, () => {
    const err = socket.authorizationError;
    console.log("C authorized", socket.authorized);
    console.log("C authorizationError", err === null ? "null" : err);
    socket.write("trusted");
  });
  socket.setEncoding("utf8");
  socket.on("data", (chunk) => console.log("C data", chunk.toString("utf8")));
  socket.on("close", () => {
    console.log("C close");
    server1.close();
    server2.close();
  });
}

function armB(port1: number, port2: number): void {
  const socket = tls.connect({ port: port1, servername: "localhost" });
  socket.on("error", (err) => {
    console.log("B error", err.message);
    armC(port2);
  });
}

server1.listen(0, () => {
  const port1 = server1.address().port;
  server2.listen(0, () => {
    const port2 = server2.address().port;
    const socket = tls.connect({ port: port1, rejectUnauthorized: false, servername: "localhost" }, () => {
      const err = socket.authorizationError;
      console.log("A authorized", socket.authorized);
      console.log("A authorizationError", err === null ? "null" : err);
      socket.write("hello");
    });
    socket.setEncoding("utf8");
    socket.on("data", (chunk) => console.log("A data", chunk.toString("utf8")));
    socket.on("close", () => {
      console.log("A close");
      armB(port1, port2);
    });
  });
});
