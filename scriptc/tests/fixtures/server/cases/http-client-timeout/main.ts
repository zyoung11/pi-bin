/* The isProxyRunning shape (portless cli-utils): a request with the
 * timeout option against a server that never answers — 'timeout' fires
 * after the idle period, destroy() tears the request down, and the
 * premature close surfaces as 'socket hang up' on 'error' before
 * 'close'. The never-answering server is a raw net server (the http
 * handler would answer); it closes on its socket's teardown. */
import { createServer } from "node:net";
import { request } from "node:http";

const server = createServer((sock) => {
  // The head arrives as one loopback chunk in both lanes; the teardown
  // logs nothing here (the accept-side close races the client's own
  // events differently between lanes — the client drives the shutdown).
  sock.on("data", () => console.log("srv got the request head"));
});

server.listen(0, () => {
  const req = request(
    { hostname: "127.0.0.1", port: server.address().port, path: "/", method: "HEAD", timeout: 300 },
    () => console.log("response?!"),
  );
  req.on("timeout", () => {
    console.log("timeout");
    req.destroy();
  });
  req.on("error", (err) => console.log(`error ${err.message}`));
  req.on("close", () => {
    console.log("req close");
    server.close(() => console.log("srv closed"));
  });
  req.end();
});
