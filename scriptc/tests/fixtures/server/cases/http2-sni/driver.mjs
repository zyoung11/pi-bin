// The http2-sni driver: per-servername certificate selection, all four
// answer paths.
//
// 1. servername localhost      -> the pre-cached context (SYNC answer)
// 2. servername alt.localhost  -> generated on demand (ASYNC answer)
// 3. servername alt.localhost  -> now cached (SYNC answer, second hit)
// 4. servername other.localhost-> cb(null, undefined): the default pair
// 5. servername fail.localhost -> cb(err): the server destroys the socket
// 6. no SNI (IP peer)          -> the callback never fires; default pair
// 7. /quit over https/1.1 to shut the server down
//
// Each leg prints the peer certificate's CN (the observable answer) or
// the failure code — byte-identical between lanes.
import { readFileSync } from "node:fs";
import { request as httpsRequest } from "node:https";
import { connect as tlsConnect } from "node:tls";

const port = Number(process.argv[2]);
const ca = readFileSync(new URL("../../certs/ca.pem", import.meta.url));

function peekCN(servername) {
  return new Promise((resolve, reject) => {
    const sock = tlsConnect(
      { host: "127.0.0.1", port, ca, ...(servername ? { servername } : {}) },
      () => {
        const cn = sock.getPeerCertificate().subject.CN;
        console.log(`${servername || "(no sni)"} -> CN=${cn}`);
        sock.end();
        sock.on("close", resolve);
      },
    );
    sock.on("error", (e) => {
      console.log(`${servername || "(no sni)"} -> error ${e.code}`);
      resolve();
    });
  });
}

function quit() {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        host: "127.0.0.1",
        servername: "localhost",
        port,
        path: "/quit",
        method: "GET",
        ca,
        headers: { connection: "close" },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          console.log(`/quit -> ${res.statusCode} body=${Buffer.concat(chunks).toString("utf8")}`);
          resolve();
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

await peekCN("localhost");
await peekCN("alt.localhost");
await peekCN("alt.localhost");
await peekCN("other.localhost");
await peekCN("fail.localhost");
await peekCN(null);
await quit();
console.log("driver done");
