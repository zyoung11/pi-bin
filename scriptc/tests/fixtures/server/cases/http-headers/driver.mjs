// Mixed-case wire headers (the server reads lowercased), then a bare
// request with none of them, then /quit.
import { request } from "node:http";

const port = Number(process.argv[2]);

function get(path, headers) {
  return new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, path, method: "GET", headers }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        console.log(
          `${path} -> ${res.statusCode} echo=${res.headers["x-echo-back"] ?? "-"} body=${Buffer.concat(chunks).toString("utf8")}`,
        );
        resolve();
      });
    });
    req.on("error", reject);
    req.end();
  });
}

await get("/first", { "X-Echo-One": "hello", Via: "1.1 proxy-a" });
await get("/second", {});
await get("/quit", { "x-echo-one": "closing" });
console.log("driver done");
