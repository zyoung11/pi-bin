/* Dot access to CANONICALIZED index-signature members — the header-family
 * shape drops @types' declared members (host?: string, via?: string) into
 * the overflow, and the dot spelling reads/writes them like brackets: the
 * proxy's restore-Host (`if (!h.host) h.host = ...`) and upgrade-rewrite
 * (`h.connection = "Upgrade"; h.upgrade = "websocket"`) idioms. */
import * as http from "node:http";

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  if (req.url === "/quit") {
    res.end("bye");
    server.close(() => console.log("server closed"));
    return;
  }
  const h: { [name: string]: string | undefined } = { ...req.headers };
  console.log(`via=${h.via !== undefined ? h.via : "absent"}`);
  // The wire Host carries the ephemeral port — drop it so the restore
  // idiom below runs deterministically for the differential compare.
  delete h["host"];
  if (!h.host) {
    h.host = "restored.local";
  }
  h.connection = "Upgrade";
  h.upgrade = "websocket";
  const host = h.host;
  const conn = h.connection;
  const up = h.upgrade;
  res.writeHead(200, {
    "x-host": host === undefined ? "-" : host,
    "x-conn": conn === undefined ? "-" : conn,
    "x-up": up === undefined ? "-" : up,
  });
  res.end("ok");
});

server.listen(0, () => {
  console.log("listening");
  process.stderr.write(`PORT ${server.address().port}\n`);
});
