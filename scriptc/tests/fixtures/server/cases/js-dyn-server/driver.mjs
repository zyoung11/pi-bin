// Two GETs then /quit; print bodies through setEncoding'd responses.
import { request } from "node:http";

const port = Number(process.argv[2]);

function get(path) {
  return new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, path }, (res) => {
      res.setEncoding("utf8");
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        console.log(`${path} -> ${res.statusCode} ${body}`);
        resolve();
      });
    });
    req.on("error", reject);
    req.end();
  });
}

await get("/a");
await get("/b");
await get("/quit");
console.log("driver done");
