/* Server and client in ONE program: the loop juggles a listening server,
 * an accepted socket, and an outbound net.connect socket at once. The
 * first write happens BEFORE 'connect' delivers (Node buffers it — so
 * does the runtime), and from there the conversation is a strict
 * ping-pong, one in-flight message, so every log is causally ordered. */
import { createServer, connect } from "node:net";

const server = createServer((sock) => {
  sock.on("data", (chunk) => {
    const text = chunk.toString("utf8");
    console.log(`server got ${text}`);
    if (text === "two") {
      sock.end("bye");
    } else {
      sock.write(`ack:${text}`);
    }
  });
  sock.on("close", () => {
    console.log("server sock closed");
    server.close(() => console.log("done"));
  });
});

server.listen(0, () => {
  const client = connect(server.address().port, "127.0.0.1");
  client.write("one"); // buffered until the connect completes, like Node
  client.on("data", (chunk) => {
    const text = chunk.toString("utf8");
    console.log(`client got ${text}`);
    if (text === "ack:one") client.write("two");
  });
  client.on("end", () => console.log("client end"));
});
