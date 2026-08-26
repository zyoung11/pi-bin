/* POST body collection — the req.on("data"/"end") shape: chunks
 * accumulate (decoded per chunk; the driver sends one write so the
 * boundary is deterministic) and 'end' answers with an echo. */
import { createServer } from "node:http";

const server = createServer((req, res) => {
  let body = "";
  req.on("data", (chunk: Buffer) => {
    body += chunk.toString("utf8");
  });
  req.on("end", () => {
    console.log(`${req.method} ${req.url} body=${body}`);
    if (req.url === "/quit") {
      res.end("bye");
      server.close(() => console.log("server closed"));
      return;
    }
    res.setHeader("content-type", "application/json");
    res.end(`{"echo":"${body}","length":${body.length}}`);
  });
});

server.listen(0, () => {
  console.log("listening");
  process.stderr.write(`PORT ${server.address().port}\n`);
});
