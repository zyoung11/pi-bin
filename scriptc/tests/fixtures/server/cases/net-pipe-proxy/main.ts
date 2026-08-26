/* The portless TCP-proxy shape: a proxy server piping bidirectionally
 * between the inbound socket and an outbound net.connect to the upstream.
 * One in-flight message end to end; the teardown chains causally (client
 * FIN → proxy → upstream → back), so every log is strictly ordered. */
import { createServer, connect } from "node:net";

const upstream = createServer((sock) => {
  sock.on("data", (chunk) => {
    const text = chunk.toString("utf8");
    console.log(`upstream got ${text}`);
    sock.write(`pong:${text}`);
  });
  sock.on("end", () => console.log("upstream end"));
});

upstream.listen(0, () => {
  const upPort = upstream.address().port;
  const proxy = createServer((client) => {
    const back = connect(upPort, "127.0.0.1");
    client.pipe(back);
    back.pipe(client);
  });
  proxy.listen(0, () => {
    const c = connect(proxy.address().port, "127.0.0.1");
    c.write("ping"); // buffered pre-connect; piped while `back` still connects
    c.on("data", (chunk) => {
      console.log(`client got ${chunk.toString("utf8")}`);
      c.end();
    });
    c.on("close", () => {
      proxy.close(() => upstream.close(() => console.log("done")));
    });
  });
});
