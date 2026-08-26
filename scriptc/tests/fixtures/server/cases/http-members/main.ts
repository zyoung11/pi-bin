/* The http member follow-ups on the SERVER side, driven by a Node
 * client: req.socket.remoteAddress (the buildForwardedHeaders shape —
 * dual-stack accept reads the v4-mapped form), res.on('close') firing
 * after the response completes (the handler's synchronous tail runs
 * first, Node's deferred emit), writeHead with a RECORD-typed headers
 * value (the proxy's { ...headers } shape reduced to Record<string,
 * string>), and res.destroy() mid-stream (the driver observes the
 * truncated body). */
import * as http from "node:http";

// The NAMESPACE import form on purpose — portless's own spelling; the
// spoke dispatch must catch `http.createServer(...)` through it too.
const server = http.createServer((req, res) => {
  if (req.url === "/forwarded") {
    const ra = req.socket.remoteAddress;
    const remote = ra !== undefined ? ra : "127.0.0.1";
    const headers: Record<string, string> = {};
    headers["x-forwarded-for"] = remote;
    headers["x-forwarded-proto"] = "http";
    res.on("close", () => console.log("forwarded res close"));
    res.writeHead(200, headers);
    res.end(`remote=${remote}`);
    console.log("after end (before close)");
    return;
  }
  if (req.url === "/abort") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.write("partial");
    res.on("close", () => console.log("abort res close"));
    // The delay lets the head + first chunk flush before the teardown in
    // both lanes (an immediate destroy races the kernel buffers — Node's
    // RST can discard the unread bytes).
    setTimeout(() => res.destroy(), 50);
    return;
  }
  if (req.url === "/quit") {
    res.end("bye");
    server.close(() => console.log("server closed"));
    return;
  }
  res.end("ok");
});

server.listen(0, () => {
  console.log("listening");
  process.stderr.write(`PORT ${server.address().port}\n`);
});
