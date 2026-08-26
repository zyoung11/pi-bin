// The SERVER side: node:https serving leaf+CA concatenated (portless's
// exact cert shape — Buffer.concat([cert, ca])).
import { readFileSync } from "node:fs";
import { createServer } from "node:https";

const port = Number(process.argv[2]);
const leaf = readFileSync(new URL("../../certs/localhost.pem", import.meta.url));
const caCert = readFileSync(new URL("../../certs/ca.pem", import.meta.url));
const key = readFileSync(new URL("../../certs/localhost-key.pem", import.meta.url));

const server = createServer({ cert: Buffer.concat([leaf, caCert]), key }, (req, res) => {
  if (req.url === "/ready") {
    res.end("ok");
    return;
  }
  console.log(`driver saw ${req.method} ${req.url}`);
  if (req.url === "/text") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("chain body");
    return;
  }
  if (req.url === "/quit") {
    res.end("bye");
    server.close(() => console.log("driver closed"));
    return;
  }
  res.writeHead(404, {});
  res.end();
});

server.on("tlsClientError", () => {});
server.listen(port);
