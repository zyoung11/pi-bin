// The http2-stream-unguarded driver: plain https/1.1 requests only —
// BOTH lanes serve this connection as HTTP/1.1, where req.stream is
// undefined (in Node by the protocol, here by the lowering), so the
// caught TypeError's message and the argument-evaluation count compare
// byte-for-byte. Connection: close so connections drain.
import { readFileSync } from "node:fs";
import { request as httpsRequest } from "node:https";

const port = Number(process.argv[2]);
const ca = readFileSync(new URL("../../certs/ca.pem", import.meta.url));

function get(path) {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        host: "127.0.0.1",
        servername: "localhost",
        port,
        path,
        method: "GET",
        ca,
        headers: { connection: "close" },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          console.log(`${path} -> ${res.statusCode} body=${Buffer.concat(chunks).toString("utf8")}`);
          resolve();
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

await get("/");
await get("/again");
await get("/quit");
