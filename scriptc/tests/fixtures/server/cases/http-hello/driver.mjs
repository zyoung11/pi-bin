// GET /, GET /missing (404 + explicit writeHead-after-setHeader), then
// /quit. Prints status, the compared headers, and the body per request —
// Date/Connection/Keep-Alive stay unprinted (Date is wall-clock).
import { request } from "node:http";

const port = Number(process.argv[2]);

function get(path) {
  return new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, path, method: "GET" }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        console.log(
          `${path} -> ${res.statusCode} ct=${res.headers["content-type"]} xp=${res.headers["x-portless"] ?? "-"} cl=${res.headers["content-length"]} body=${body}`,
        );
        resolve();
      });
    });
    req.on("error", reject);
    req.end();
  });
}

await get("/");
await get("/plain");
await get("/missing");
await get("/quit");
console.log("driver done");
