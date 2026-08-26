/* The portless isProxyRunning shape, verbatim: `const requestFn = tls ?
 * https.request : http.request` (the module-function-as-value ternary
 * over a defaulted parameter) called with the conditional
 * rejectUnauthorized spread. Probed against a plain http server, an
 * https server (self-signed chain, verification off), the wrong
 * protocol in each direction, and a refused port — every leg through
 * the ONE binding. */
import * as http from "node:http";
import * as https from "node:https";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";

const PORTLESS_HEADER = "X-Portless";
const SOCKET_TIMEOUT_MS = 3000;

const cert = readFileSync("tests/fixtures/server/certs/localhost.pem");
const key = readFileSync("tests/fixtures/server/certs/localhost-key.pem");

function isProxyRunning(port: number, tls = false): Promise<boolean> {
  return new Promise((resolve) => {
    const requestFn = tls ? https.request : http.request;
    const req = requestFn(
      {
        hostname: "127.0.0.1",
        port,
        path: "/",
        method: "HEAD",
        timeout: SOCKET_TIMEOUT_MS,
        ...(tls ? { rejectUnauthorized: false } : {}),
      },
      (res) => {
        res.resume();
        resolve(res.headers[PORTLESS_HEADER.toLowerCase()] === "1");
      }
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

const plain = http.createServer((req, res) => {
  res.writeHead(200, { [PORTLESS_HEADER]: "1" });
  res.end();
});

const secure = https.createServer({ cert, key }, (req, res) => {
  res.writeHead(200, { [PORTLESS_HEADER]: "1" });
  res.end();
});

async function main(plainPort: number, securePort: number, freePort: number): Promise<void> {
  console.log("http probe:", await isProxyRunning(plainPort));
  console.log("https probe:", await isProxyRunning(securePort, true));
  console.log("https against plain:", await isProxyRunning(plainPort, true));
  console.log("refused (http arm):", await isProxyRunning(freePort));
  console.log("refused (https arm):", await isProxyRunning(freePort, true));
  plain.close();
  secure.close(() => console.log("done"));
}

plain.listen(0, () => {
  const plainPort = plain.address().port;
  secure.listen(0, () => {
    const securePort = secure.address().port;
    // An ephemeral port that nothing listens on: bind, note, release.
    const probe = createServer();
    probe.listen(0, () => {
      const freePort = probe.address().port;
      probe.close(() => {
        main(plainPort, securePort, freePort);
      });
    });
  });
});
