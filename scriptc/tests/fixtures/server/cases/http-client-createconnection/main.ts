/* http.request({ createConnection }) — the proxy's own-dialer form: the
 * dialer closure runs once, synchronously, and its net.connect socket
 * carries the exchange; hostname/port never appear (the explicit
 * headers.host wins verbatim, exactly the portless proxy shape). A
 * driver-less self-dial differential case. */
import * as http from "node:http";
import * as net from "node:net";

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  console.log(`${req.method} ${req.url} host=${req.headers.host}`);
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("hi");
  server.close();
});

server.listen(0, () => {
  const port = server.address().port;
  const req = http.request(
    {
      createConnection: () => net.connect(port),
      path: "/via-dialer",
      method: "GET",
      headers: { host: "myapp.localhost", "x-portless-hops": "1" },
    },
    (res: http.IncomingMessage) => {
      let body = "";
      res.on("data", (c: Buffer) => {
        body += c.toString("utf8");
      });
      res.on("end", () => console.log(`res ${res.statusCode} body=${body}`));
    }
  );
  req.end();
});
