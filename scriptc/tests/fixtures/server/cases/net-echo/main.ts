/* The driver-pattern exemplar: an echo server the harness's client
 * driver talks to. Every log is causally ordered by the driver's strict
 * request/response pacing (one in-flight message — chunk boundaries stay
 * deterministic on loopback), so stdout compares byte-exact. */
import { createServer } from "node:net";

const server = createServer((sock) => {
  console.log("connection");
  sock.on("data", (chunk) => {
    const text = chunk.toString("utf8");
    console.log(`data ${text}`);
    if (text === "quit") {
      sock.end("bye");
      server.close(() => console.log("server closed"));
    } else {
      sock.write(`echo:${text}`);
    }
  });
  sock.on("end", () => console.log("end"));
  sock.on("close", () => console.log("close"));
});

server.listen(0, () => {
  console.log("listening");
  process.stderr.write(`PORT ${server.address().port}\n`);
});
