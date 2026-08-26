// The http-hello driver over node:https, trusting the fixture CA. Date/
// Connection/Keep-Alive stay unprinted (Date is wall-clock).
import { readFileSync } from "node:fs";
import { request } from "node:https";

const port = Number(process.argv[2]);
const ca = readFileSync(new URL("../../certs/ca.pem", import.meta.url));

function get(path) {
  return new Promise((resolve, reject) => {
    const req = request(
      { host: "127.0.0.1", servername: "localhost", port, path, method: "GET", ca },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          console.log(
            `${path} -> ${res.statusCode} ct=${res.headers["content-type"]} xp=${res.headers["x-portless"] ?? "-"} cl=${res.headers["content-length"]} body=${body}`,
          );
          resolve();
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

await get("/");
await get("/plain");
await get("/quit");
console.log("driver done");
