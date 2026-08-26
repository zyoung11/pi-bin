/* err.code on dgram 'error' events: a second bind of a taken port (no
 * reuseAddr) fires 'error' with code EADDRINUSE — the same stamping the
 * spawn 'error' event got (SEMANTICS divergence 13). The message carries
 * the lane-local ephemeral port, so only the code and shape print. */
import { createSocket } from "node:dgram";

const first = createSocket("udp4");
first.bind(0, "127.0.0.1", () => {
  const port = first.address().port;
  const dup = createSocket("udp4");
  dup.on("error", (err) => {
    const code = (err as NodeJS.ErrnoException).code;
    console.log(`bind code: ${code}`, code === "EADDRINUSE");
    console.log("bind message shape:", err.message.startsWith("bind EADDRINUSE 127.0.0.1:"));
    dup.close();
    first.close();
  });
  dup.bind(port, "127.0.0.1");
});
