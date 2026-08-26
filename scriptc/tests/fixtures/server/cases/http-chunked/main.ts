/* Chunked responses: res.write before end streams with chunked framing
 * (the driver asserts the Transfer-Encoding and reassembles the body),
 * and headersSent flips across the first write. */
import { createServer } from "node:http";

const server = createServer((req, res) => {
  console.log(`sent-before=${res.headersSent}`);
  res.setHeader("content-type", "text/plain");
  res.write("first ");
  console.log(`sent-after=${res.headersSent}`);
  res.write("second ");
  res.end("last");
  if (req.url === "/quit") {
    server.close(() => console.log("server closed"));
  }
});

server.listen(0, () => {
  console.log("listening");
  process.stderr.write(`PORT ${server.address().port}\n`);
});
