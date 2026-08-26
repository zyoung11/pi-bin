/* Portless's first-byte TLS demux, verbatim shape (proxy.ts): a net
 * wrapper peeks one byte with once('readable') + read(1), puts it back
 * with unshift, and routes the connection — 0x16 (a TLS ClientHello) to
 * the https server, anything else to the plain-http redirecter — via
 * server.emit("connection", socket). The dead-peer arm (readable at EOF,
 * read(1) answering null) destroys. Byte-pinned against Node with TLS,
 * plain, and dead-peer first bytes. */
import { readFileSync } from "node:fs";
import { createServer as createNetServer } from "node:net";
import { createServer as createHttpServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";

const cert = readFileSync("tests/fixtures/server/certs/localhost.pem");
const key = readFileSync("tests/fixtures/server/certs/localhost-key.pem");

const secure = createHttpsServer({ cert, key }, (req, res) => {
  console.log(`secure ${req.method} ${req.url}`);
  if (req.url === "/quit") {
    res.end("bye");
    wrapper.close(() => console.log("wrapper closed"));
    return;
  }
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("hello over tls");
});

const plain = createHttpServer((req, res) => {
  console.log(`plain ${req.method} ${req.url}`);
  res.writeHead(302, { location: `https://localhost${req.url}` });
  res.end();
});

const wrapper = createNetServer((socket) => {
  socket.on("error", () => socket.destroy());
  socket.once("readable", () => {
    const buf = socket.read(1);
    if (buf === null) {
      console.log("peek eof");
      socket.destroy();
      return;
    }
    socket.unshift(buf);
    if (buf[0] === 0x16) {
      console.log("route tls");
      secure.emit("connection", socket);
    } else {
      console.log("route plain");
      plain.emit("connection", socket);
    }
  });
});

wrapper.listen(0, () => {
  console.log("listening");
  process.stderr.write(`PORT ${wrapper.address().port}\n`);
});
