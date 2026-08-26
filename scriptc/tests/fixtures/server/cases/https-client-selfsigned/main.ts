/* The self-signed server shapes: default verification refuses with
 * Node's "self-signed certificate"; an explicit (wrong) ca refuses the
 * same way; rejectUnauthorized: false connects — portless's
 * isProxyRunning probe against its own minted certs. */
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { request } from "node:https";
import type { IncomingMessage } from "node:http";

const ca = readFileSync("tests/fixtures/server/certs/ca.pem");

let port = 0;
let attempts = 0;

function onRes(res: IncomingMessage, path: string, mode: string, next: () => void): void {
  const sc = res.statusCode;
  let body = "";
  res.on("data", (chunk: Buffer) => {
    body += chunk.toString("utf8");
  });
  res.on("end", () => {
    console.log(`${mode} ${path} status=${sc !== undefined ? sc : -1} body=${body}`);
    next();
  });
}

function tryGet(path: string, mode: string, next: () => void): void {
  const req = mode === "default"
    ? request({ hostname: "localhost", port, path, method: "GET" }, (res) => onRes(res, path, mode, next))
    : mode === "wrong-ca"
      ? request({ hostname: "localhost", port, path, method: "GET", ca }, (res) => onRes(res, path, mode, next))
      : request({ hostname: "localhost", port, path, method: "GET", rejectUnauthorized: false }, (res) => onRes(res, path, mode, next));
  req.on("error", (err) => {
    console.log(`${mode} ${path} error ${err.message}`);
    next();
  });
  req.end();
}

function start(): void {
  attempts++;
  const req = request(
    { hostname: "localhost", port, path: "/ready", method: "GET", rejectUnauthorized: false },
    (res) => {
      res.on("end", () => {
        console.log("driver up");
        tryGet("/text", "default", () => {
          tryGet("/text", "wrong-ca", () => {
            tryGet("/text", "insecure", () => {
              tryGet("/quit", "insecure", () => console.log("done"));
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
