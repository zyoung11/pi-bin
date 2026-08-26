// Three connections in sequence: (1) plain-TCP garbage — the server must
// drop it without a word; (2) a TLS client trusting the WRONG CA — the
// client refuses the server cert (its error message is Node's, identical
// against both lanes) and the server stays silent; (3) a good client
// that quits the server. Sequential so all three legs order
// deterministically.
import { readFileSync } from "node:fs";
import { connect as netConnect } from "node:net";
import { connect as tlsConnect } from "node:tls";

const port = Number(process.argv[2]);
const wrongCa = readFileSync(new URL("../../certs/ca2.pem", import.meta.url));
const ca = readFileSync(new URL("../../certs/ca.pem", import.meta.url));

function garbage() {
  return new Promise((resolve) => {
    const sock = netConnect(port, "127.0.0.1");
    sock.on("connect", () => sock.write("this is not a tls hello\r\n"));
    sock.on("data", () => {}); // flow, so the server's teardown is observed
    sock.on("error", () => {});
    sock.on("close", () => {
      console.log("driver garbage closed");
      resolve();
    });
  });
}

function wrongCA() {
  return new Promise((resolve) => {
    const sock = tlsConnect({ port, host: "127.0.0.1", servername: "localhost", ca: wrongCa });
    sock.on("secureConnect", () => console.log("driver wrong-ca UNEXPECTEDLY connected"));
    sock.on("error", (err) => console.log(`driver wrong-ca error ${err.message}`));
    sock.on("close", () => {
      console.log("driver wrong-ca closed");
      resolve();
    });
  });
}

function good() {
  return new Promise((resolve) => {
    const sock = tlsConnect({ port, host: "127.0.0.1", servername: "localhost", ca });
    sock.setEncoding("utf8");
    sock.on("secureConnect", () => {
      console.log("driver connected");
      sock.write("quit");
    });
    sock.on("data", (text) => console.log(`driver got ${text}`));
    sock.on("close", () => {
      console.log("driver close");
      resolve();
    });
  });
}

await garbage();
await wrongCA();
await good();
console.log("driver done");
