/* http2.createServer + connect — the core h2c loop (scr_http2.c: real
 * HTTP/2 framing + HPACK). A self-contained client+server program (the
 * Node-suite http2 shape): the server answers one stream with headers +
 * a two-chunk body, the client reads response headers, data, and end.
 * No driver — both lanes run it in-process; stdout is compared. */
import * as http2 from "node:http2";

const server = http2.createServer();
server.on("stream", (stream: http2.ServerHttp2Stream, headers: http2.IncomingHttpHeaders) => {
  console.log("S: path-is-abc", headers[":path"] === "/abc");
  console.log("S: method-is-get", headers[":method"] === "GET");
  console.log("S: scheme-is-http", headers[":scheme"] === "http");
  stream.respond({ ":status": 200, "content-type": "text/plain" });
  stream.write("hel");
  stream.end("lo");
});

server.listen(0, () => {
  const port = server.address().port;
  const client = http2.connect(`http://localhost:${port}`);
  const req = client.request({ ":path": "/abc" });
  req.setEncoding("utf8");
  let data = "";
  req.on("response", (headers: http2.IncomingHttpHeaders) => {
    console.log("C: status-200", headers[":status"] === 200);
    console.log("C: ctype-ok", headers["content-type"] === "text/plain");
  });
  req.on("data", (d: any) => { data += d; });
  req.on("end", () => console.log("C: body", data));
  req.on("close", () => {
    console.log("C: rstCode-0", req.rstCode === 0);
    client.close();
    server.close();
  });
  req.end();
});
