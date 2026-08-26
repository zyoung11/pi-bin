/* Connection refusal through the http client: bind an ephemeral port,
 * release it, then http.request it — 'error' delivers Node's exact
 * message shape (connect ECONNREFUSED 127.0.0.1:<port>, the net slice's
 * own formatting) and 'close' follows, with no response callback ever
 * firing. */
import { createServer } from "node:net";
import { request } from "node:http";

const probe = createServer();
probe.listen(0, () => {
  const port = probe.address().port;
  probe.close(() => {
    const req = request({ hostname: "127.0.0.1", port, path: "/", method: "GET" }, () => {
      console.log("response?!");
    });
    req.on("error", (err) => {
      if (err.message.startsWith("connect ECONNREFUSED 127.0.0.1:")) {
        console.log("refused");
      } else {
        console.log(`unexpected: ${err.message}`);
      }
    });
    req.on("close", () => console.log("req close"));
    req.end();
  });
});
