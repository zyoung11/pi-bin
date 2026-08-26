/* The PURE https-client differential (the http-client-node-server
 * pattern, inverted port protocol): this program is only a CLIENT and
 * the driver is a real node:https server with the fixture leaf cert.
 * Exercises the verify paths portless's flows need: `ca` (its own local
 * CA), NO ca (trust failure — "unable to verify the first certificate"
 * for a leaf whose issuer never arrived), and rejectUnauthorized: false
 * (the isProxyRunning probe shape). */
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { request } from "node:https";
import type { IncomingMessage } from "node:http";

const ca = readFileSync("tests/fixtures/server/certs/ca.pem");

let port = 0;
let attempts = 0;

function fetchPath(path: string, method: string, useCa: boolean, insecure: boolean, next: () => void): void {
  const req = insecure
    ? request({ hostname: "localhost", port, path, method, rejectUnauthorized: false }, (res) => onRes(res, path, method, next))
    : useCa
      ? request({ hostname: "localhost", port, path, method, ca }, (res) => onRes(res, path, method, next))
      : request({ hostname: "localhost", port, path, method }, (res) => onRes(res, path, method, next));
  req.on("error", (err) => {
    console.log(`${method} ${path} error ${err.message}`);
    next();
  });
  req.end();
}

function onRes(res: IncomingMessage, path: string, method: string, next: () => void): void {
  const sc = res.statusCode;
  const te = res.headers["transfer-encoding"];
  const cl = res.headers["content-length"];
  console.log(
    `${method} ${path} status=${sc !== undefined ? sc : -1} te=${te !== undefined ? te : "-"} cl=${cl !== undefined ? cl : "-"}`,
  );
  let body = "";
  res.on("data", (chunk: Buffer) => {
    body += chunk.toString("utf8");
  });
  res.on("end", () => {
    console.log(`${method} ${path} body=${body}`);
    next();
  });
}

function start(): void {
  attempts++;
  const req = request(
    { hostname: "localhost", port, path: "/ready", method: "GET", rejectUnauthorized: false },
    (res) => {
      res.on("end", () => {
        console.log("driver up");
        fetchPath("/text", "GET", true, false, () => {
          fetchPath("/text", "GET", false, false, () => {
            fetchPath("/chunked", "GET", true, false, () => {
              fetchPath("/text", "HEAD", true, false, () => {
                fetchPath("/text", "GET", false, true, () => {
                  fetchPath("/quit", "GET", true, false, () => console.log("done"));
                });
              });
            });
          });
        });
      });
      res.on("data", () => {});
    },
  );
  req.on("error", () => {
    if (attempts < 400) {
      setTimeout(start, 25);
    } else {
      console.log("driver never came up");
    }
  });
  req.end();
}

const probe = createServer();
probe.listen(0, () => {
  port = probe.address().port;
  probe.close(() => {
    process.stderr.write(`PORT ${port}\n`);
    start();
  });
});
