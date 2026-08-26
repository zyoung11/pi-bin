// POST with Content-Length (one write), then a CHUNKED request body
// (flushed in two pieces with a wait between, so the server sees the
// chunked framing), then /quit.
import { request } from "node:http";

const port = Number(process.argv[2]);

function post(path, sendBody, { chunked = false } = {}) {
  return new Promise((resolve, reject) => {
    const headers = chunked ? { "transfer-encoding": "chunked" } : {};
    const req = request({ host: "127.0.0.1", port, path, method: "POST", headers }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        console.log(`${path} -> ${res.statusCode} body=${Buffer.concat(chunks).toString("utf8")}`);
        resolve();
      });
    });
    req.on("error", reject);
    if (chunked) {
      req.write(sendBody.slice(0, 4));
      setTimeout(() => {
        req.write(sendBody.slice(4));
        req.end();
      }, 30);
    } else {
      req.end(sendBody);
    }
  });
}

await post("/echo", "hello wörld");
await post("/echo", "chunked-body", { chunked: true });
await post("/quit", "");
console.log("driver done");
