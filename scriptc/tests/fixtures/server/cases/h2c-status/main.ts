/* Status codes over h2c — the test-http2-status-code shape: N requests,
 * each answered with a distinct :status and endStream, verified on the
 * client. Sequential (one request per response) so stdout is ordered. */
import * as http2 from "node:http2";

const codes = [200, 202, 404, 500];
let served = 0;

const server = http2.createServer();
server.on("stream", (stream: http2.ServerHttp2Stream) => {
  const status = codes[served++]!;
  stream.respond({ ":status": status }, { endStream: true });
});

server.listen(0, () => {
  const client = http2.connect(`http://localhost:${server.address().port}`);
  let i = 0;
  const doOne = () => {
    const expected = codes[i]!;
    const req = client.request();
    req.on("response", (headers: http2.IncomingHttpHeaders) => {
      console.log(`status ${expected}`, headers[":status"] === expected);
    });
    req.resume();
    req.on("end", () => {
      i++;
      if (i < codes.length) {
        doOne();
      } else {
        client.close();
        server.close();
      }
    });
  };
  doOne();
});
