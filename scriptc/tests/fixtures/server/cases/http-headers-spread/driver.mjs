// The http-headers-spread driver: one GET with pinned headers (the keys
// line is arrival-ordered), reading back the outgoing matrix — the
// formatted number, both set-cookie lines, and the value forwarded
// through the merged record. Then /quit.
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
        headers: { "x-alpha": "a", "x-beta": "b", connection: "close" },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          console.log(
            `${path} -> ${res.statusCode} num=${res.headers["x-num"]} cookies=${JSON.stringify(res.headers["set-cookie"] ?? null)} fwd=${res.headers["x-fwd"]} body=${Buffer.concat(chunks).toString("utf8")}`,
          );
          resolve();
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

await go("/headers");
await go("/quit");
console.log("driver done");
