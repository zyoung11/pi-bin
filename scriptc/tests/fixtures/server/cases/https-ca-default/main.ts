/* setDefaultCACertificates is LIVE trust: the client never passes a `ca`
 * option — the DEFAULT anchors decide. With the local CA installed via
 * setDefaultCACertificates the request verifies; with the empty set it
 * fails exactly like the leaf-only no-ca shape ("unable to verify the
 * first certificate"); getCACertificates('default') reflects each state.
 * The https-client-basic pattern: this program is only a client, the
 * driver is a real node:https server with the fixture leaf. */
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { request } from "node:https";
import { getCACertificates, setDefaultCACertificates } from "node:tls";
import type { IncomingMessage } from "node:http";

const ca = readFileSync("tests/fixtures/server/certs/ca.pem", "utf8");

let port = 0;
let attempts = 0;

function fetchPath(path: string, insecure: boolean, next: () => void): void {
  const req = insecure
    ? request({ hostname: "localhost", port, path, method: "GET", agent: false, rejectUnauthorized: false }, (res) => onRes(res, path, next))
    : request({ hostname: "localhost", port, path, method: "GET", agent: false }, (res) => onRes(res, path, next));
  req.on("error", (err) => {
    console.log(`${path} error ${err.message}`);
    next();
  });
  req.end();
}

function onRes(res: IncomingMessage, path: string, next: () => void): void {
  console.log(`${path} status=${res.statusCode !== undefined ? res.statusCode : -1}`);
  let body = "";
  res.on("data", (chunk: Buffer) => {
    body += chunk.toString("utf8");
  });
  res.on("end", () => {
    console.log(`${path} body=${body}`);
    next();
  });
}

function run(): void {
  // The local CA becomes the WHOLE default store: the leaf verifies.
  setDefaultCACertificates([ca]);
  console.log("default-size", getCACertificates("default").length);
  fetchPath("/text", false, () => {
    // Trust nothing: the same request now fails verification.
    setDefaultCACertificates([]);
    console.log("default-size", getCACertificates("default").length);
    fetchPath("/text", false, () => {
      // Restore the local CA — trust is per-dial, not per-process-start.
      setDefaultCACertificates([ca]);
      fetchPath("/text", false, () => {
        fetchPath("/quit", true, () => console.log("done"));
      });
    });
  });
}

function start(): void {
  attempts++;
  const req = request(
    { hostname: "localhost", port, path: "/ready", method: "GET", rejectUnauthorized: false },
    (res) => {
      res.on("end", () => {
        console.log("driver up");
        run();
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
