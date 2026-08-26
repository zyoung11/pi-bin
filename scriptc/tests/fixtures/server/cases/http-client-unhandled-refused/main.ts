/* An http client 'error' with NO listener is fatal: exit code 1, like
 * Node's unhandled 'error' EventEmitter throw (stderr wording is the
 * runtime's own — never compared). */
import { createServer } from "node:net";
import { request } from "node:http";

const probe = createServer();
probe.listen(0, () => {
  const port = probe.address().port;
  probe.close(() => {
    console.log("requesting");
    const req = request({ hostname: "127.0.0.1", port, path: "/" }, () => {
      console.log("response?!");
    });
    req.end();
  });
});
