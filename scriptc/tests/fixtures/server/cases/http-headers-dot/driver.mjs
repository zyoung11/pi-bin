// The http-headers-dot driver: one GET carrying Via (a canonicalized
// declared member read back through the dot spelling) plus the Host the
// client always sends, reading back the dot-written connection/upgrade
// rewrites. Then /quit.
import { request } from "node:http";

const port = Number(process.argv[2]);

function go(path) {
  return new Promise((resolve, reject) => {
    const req = request(
      {
        host: "127.0.0.1",
        port,
        path,
        method: "GET",
        headers: { via: "1.1 proxy-a", connection: "close" },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          console.log(
            `${path} -> ${res.statusCode} host=${res.headers["x-host"]} conn=${res.headers["x-conn"]} up=${res.headers["x-up"]} body=${Buffer.concat(chunks).toString("utf8")}`,
          );
          resolve();
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

await go("/dot");
await go("/quit");
console.log("driver done");
