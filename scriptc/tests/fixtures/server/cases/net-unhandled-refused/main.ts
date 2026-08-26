/* A socket 'error' with NO listener: Node throws the unhandled-'error'
 * exception and exits 1; the runtime prints its own report to stderr and
 * exits 1 too. stdout (the line before the failure) and the exit code
 * are the compared legs — stderr text is each lane's own voice. */
import { createServer, connect } from "node:net";

const probe = createServer();
probe.listen(0, () => {
  const port = probe.address().port;
  probe.close(() => {
    console.log("connecting");
    connect(port, "127.0.0.1");
  });
});
