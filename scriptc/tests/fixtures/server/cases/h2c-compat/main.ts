/* The h2 COMPAT layer (Http2ServerRequest/Http2ServerResponse over real
 * h2c streams): createServer's eager (req, res) handler, the http1-style
 * response surface writing HEADERS/DATA frames, req's line/headers/
 * version reads, and the connection-specific header drop. Self-contained
 * client+server program; stdout is compared between lanes. */
import * as http2 from "node:http2";

const body = "<html><body>hello compat</body></html>";

const server = http2.createServer((req, res) => {
  console.log("S: method", req.method);
  console.log("S: url", req.url);
  console.log("S: httpVersion", req.httpVersion);
  console.log("S: version-major", req.httpVersionMajor);
  console.log("S: path-header", req.headers[":path"] === "/abc");
  console.log("S: authority-present", req.headers[":authority"] !== undefined);
  console.log("S: aborted", req.aborted);
  res.setHeader("foobar", "baz");
  res.setHeader("X-POWERED-BY", "scriptc-test");
  res.setHeader("connection", "connection-test");
  res.statusCode = 200;
  res.write("part1|");
  res.end(body);
});

server.listen(0, () => {
  const client = http2.connect(`http://localhost:${server.address().port}`);
  const req = client.request({ ":path": "/abc" });
  req.setEncoding("utf8");
  req.on("response", (headers: http2.IncomingHttpHeaders) => {
    console.log("C: status", headers[":status"] === 200);
    console.log("C: foobar", headers.foobar === "baz");
    console.log("C: powered-by-lowered", headers["x-powered-by"] === "scriptc-test");
    console.log("C: connection-dropped", headers.connection === undefined);
    console.log("C: date-present", headers.date !== undefined);
  });
  let data = "";
  req.on("data", (d: any) => { data += d; });
  req.on("end", () => {
    console.log("C: body", data === "part1|" + body);
    client.close();
    server.close();
  });
  req.end();
});
