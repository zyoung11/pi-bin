// The SERVER side: a node:https server with the SELF-SIGNED fixture
// leaf. The fixture's default/wrong-ca requests fail their handshakes
// (absorbed here); only the insecure ones arrive.
import { readFileSync } from "node:fs";
import { createServer } from "node:https";

const port = Number(process.argv[2]);
const cert = readFileSync(new URL("../../certs/selfsigned.pem", import.meta.url));
const key = readFileSync(new URL("../../certs/selfsigned-key.pem", import.meta.url));

const server = createServer({ cert, key }, (req, res) => {
  if (req.url === "/ready") {
    res.end("ok");
    return;
  }
  console.log(`driver saw ${req.method} ${req.url}`);
  if (req.url === "/text") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("self-signed body");
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
