// One streamed response, then /quit: prints the transfer-encoding and
// the reassembled body (chunk boundaries are not contractual).
import { request } from "node:http";

const port = Number(process.argv[2]);

function get(path) {
  return new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, path, method: "GET" }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        console.log(
          `${path} -> ${res.statusCode} te=${res.headers["transfer-encoding"]} cl=${res.headers["content-length"] ?? "-"} body=${Buffer.concat(chunks).toString("utf8")}`,
        );
        resolve();
      });
    });
    req.on("error", reject);
    req.end();
  });
}

await get("/stream");
await get("/quit");
console.log("driver done");
