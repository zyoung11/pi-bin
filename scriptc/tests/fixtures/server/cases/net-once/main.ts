/* once() semantics: a once('connect') client listener, and a once('data')
 * listener registered BEFORE the persistent one — both fire for the first
 * chunk in registration order, only the persistent one sees the second.
 * Strict ping-pong keeps chunk boundaries deterministic. */
import { createServer, connect } from "node:net";

const server = createServer((sock) => {
  sock.once("data", (chunk) => {
    console.log(`once saw ${chunk.toString("utf8")}`);
  });
  sock.on("data", (chunk) => {
    const text = chunk.toString("utf8");
    console.log(`server got ${text}`);
    if (text === "second") {
      sock.end();
      server.close(() => console.log("done"));
    } else {
      sock.write("go on");
    }
  });
});

server.listen(0, () => {
  const client = connect(server.address().port, "127.0.0.1");
  client.once("connect", () => {
    console.log("connected");
    client.write("first");
  });
  client.on("data", () => {
    client.write("second");
  });
  client.on("end", () => console.log("client end"));
});
