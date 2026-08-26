/* The header-record flows: `{ ...req.headers, key: v }` (the proxy's
 * forwarded-header build — a fresh snapshot record whose spread merges
 * into the outgoing literal), Object.keys over the merged record, and
 * the OUTGOING value matrix through writeHead — a number formats, a
 * string[] writes one line per element (set-cookie's shape). */
import * as http from "node:http";

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  if (req.url === "/quit") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("bye");
    server.close(() => console.log("server closed"));
    return;
  }
  const merged: { [name: string]: string | undefined } = { ...req.headers, "x-proxied": "1" };
  console.log(`keys=${Object.keys(merged).join(",")}`);
  const fwd = merged["x-proxied"];
  const out: http.OutgoingHttpHeaders = {
    "content-type": "text/plain",
    "x-num": 7,
    "set-cookie": ["a=1", "b=2"],
    "x-fwd": fwd === undefined ? "-" : fwd,
  };
  res.writeHead(200, out);
  res.end("ok");
});

server.listen(0, () => {
  console.log("listening");
  process.stderr.write(`PORT ${server.address().port}\n`);
});
