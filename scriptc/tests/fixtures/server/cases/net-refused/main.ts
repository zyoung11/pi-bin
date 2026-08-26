/* Connection refusal: bind an ephemeral port, release it, then connect
 * to it — refused in both lanes. The error message carries the (lane-
 * local) ephemeral port, so the fixture checks Node's exact message
 * SHAPE and prints a stable line; 'close' follows 'error' like Node. */
import { createServer, connect } from "node:net";

const probe = createServer();
probe.listen(0, () => {
  const port = probe.address().port;
  probe.close(() => {
    const sock = connect(port, "127.0.0.1");
    sock.on("error", (err) => {
      if (err.message.startsWith("connect ECONNREFUSED 127.0.0.1:")) {
        console.log("refused");
      } else {
        console.log(`unexpected: ${err.message}`);
      }
    });
    sock.on("close", () => {
      console.log("closed");
    });
  });
});
