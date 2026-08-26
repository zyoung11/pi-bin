// Drives the member-follow-up server: checks the record-built forwarded
// headers echo the driver's own address, then the mid-stream destroy
// (a request whose response dies before completing), then /quit.
import { request } from "node:http";

const port = Number(process.argv[2]);

function get(path) {
  return new Promise((resolve) => {
    const req = request({ host: "127.0.0.1", port, path, method: "GET" }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("error", () => {});
      res.on("close", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        console.log(
          `${path} -> ${res.statusCode} xff=${res.headers["x-forwarded-for"] ?? "-"} proto=${res.headers["x-forwarded-proto"] ?? "-"} body=${body} complete=${res.complete}`,
        );
        resolve();
      });
    });
    req.on("error", () => {
      console.log(`${path} -> request error`);
      resolve();
    });
    req.end();
  });
}

await get("/forwarded");
await get("/abort");
await get("/quit");
console.log("driver done");
