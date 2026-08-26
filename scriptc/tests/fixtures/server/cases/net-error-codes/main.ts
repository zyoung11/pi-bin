/* err.code on net 'error' events — the EADDRINUSE/ECONNREFUSED reads
 * portless makes. A second listener on a taken port fires 'error' with
 * code EADDRINUSE; connecting to a released port fires 'error' with code
 * ECONNREFUSED. Messages carry lane-local ephemeral ports, so only the
 * CODE and message shape print. */
import { createServer, connect } from "node:net";

const probe = createServer();
probe.listen(0, () => {
  const port = probe.address().port;
  const dup = createServer();
  dup.on("error", (err) => {
    const code = (err as NodeJS.ErrnoException).code;
    console.log(`listen code: ${code}`, code === "EADDRINUSE");
    console.log("listen message shape:", err.message.startsWith("listen EADDRINUSE"));
    // Release the port, then the refusal leg.
    probe.close(() => {
      const sock = connect(port, "127.0.0.1");
      sock.on("error", (e) => {
        const c = (e as NodeJS.ErrnoException).code;
        console.log(`connect code: ${c}`, c === "ECONNREFUSED");
        console.log("connect message shape:", e.message.startsWith("connect ECONNREFUSED 127.0.0.1:"));
      });
      sock.on("close", () => {
        console.log("closed");
      });
    });
  });
  dup.listen(port);
});
