// POST a body to /, then to /quit; print echoed bodies.
import { request } from "node:http";

const port = Number(process.argv[2]);

function post(path, body) {
  return new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, path, method: "POST" }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        console.log(`${path} -> ${res.statusCode} ${Buffer.concat(chunks).toString("utf8")}`);
        resolve();
      });
    });
    req.on("error", reject);
    req.end(body);
  });
}

await post("/", "héllo");
await post("/quit", "bye now");
console.log("driver done");
