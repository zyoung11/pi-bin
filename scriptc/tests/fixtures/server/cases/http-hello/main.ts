/* The portless handleRequest shape reduced to its bones: read url and
 * method, answer with writeHead(status, literal headers) + end(body).
 * The driver requests twice, then /quit closes the server. */
import { createServer } from "node:http";

const server = createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  if (req.url === "/quit") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("bye");
    server.close(() => console.log("server closed"));
    return;
  }
  if (req.url === "/missing") {
    res.writeHead(404, { "content-type": "text/html" });
    res.end("<h1>Not Found</h1>");
    return;
  }
  if (req.url === "/plain") {
    // No writeHead: the implicit head carries Content-Length (Node's
    // end-before-head framing).
    res.setHeader("content-type", "text/plain");
    res.end("plain body");
    return;
  }
  res.setHeader("x-portless", "1");
  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  res.end("héllo wörld 😀");
});

server.listen(0, () => {
  console.log("listening");
  process.stderr.write(`PORT ${server.address().port}\n`);
});
