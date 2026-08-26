/* Stream cancellation over h2c: the client cancels a stream with
 * NGHTTP2_CANCEL; both sides observe rstCode 8 on 'close'. CANCEL is a
 * clean cancel — no 'error' fires (Node's rule). A countdown closes both
 * endpoints only after BOTH 'close' events land, so stdout is ordered
 * (server line first: the client waits on the server's observation). */
import * as http2 from "node:http2";

let serverClosed = false;
let clientClosed = false;

const server = http2.createServer();
server.on("stream", (stream: http2.ServerHttp2Stream) => {
  stream.on("close", () => {
    console.log("S: close rstCode-8", stream.rstCode === 8);
    serverClosed = true;
    maybeDone();
  });
  // never respond — wait for the client's cancel
});

let client: http2.ClientHttp2Session;
function maybeDone(): void {
  if (serverClosed && clientClosed) {
    client.close();
    server.close();
  }
}

server.listen(0, () => {
  client = http2.connect(`http://localhost:${server.address().port}`);
  const req = client.request({ ":path": "/slow" });
  req.on("close", () => {
    console.log("C: close rstCode-8", req.rstCode === 8);
    clientClosed = true;
    maybeDone();
  });
  req.close(http2.constants.NGHTTP2_CANCEL);
});
