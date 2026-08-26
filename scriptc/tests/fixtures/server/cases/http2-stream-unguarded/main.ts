/* The UNGUARDED h2-only member call (portless's handleExtendedConnect
 * shape: req.stream.on/destroy with no ?.) — on an HTTP/1.1 connection
 * req.stream is undefined in Node AND here, so the call is JS's member
 * read on undefined: it throws the exact TypeError, catchably, and the
 * arguments never evaluate. Both lanes serve HTTP/1.1 to this driver, so
 * the caught error's name/message and the argument-evaluation order pin
 * byte-for-byte. */
import { readFileSync } from "node:fs";
import * as http2 from "node:http2";

const cert = readFileSync("tests/fixtures/server/certs/localhost.pem");
const key = readFileSync("tests/fixtures/server/certs/localhost-key.pem");

const server = http2.createSecureServer({ allowHTTP1: true, cert, key });

let evaluated = 0;
function listener(): void {
  evaluated = evaluated + 1;
}

server.on("request", (req: http2.Http2ServerRequest, res: http2.Http2ServerResponse) => {
  if (req.url === "/quit") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("bye");
    server.close(() => console.log("server closed"));
    return;
  }
  let answer = "no-throw";
  try {
    // Unguarded: throws before the argument list evaluates.
    req.stream.on("error", listener);
  } catch (e) {
    if (e instanceof TypeError) {
      answer = `TypeError: ${(e as Error).message}`;
    } else {
      answer = "not-a-TypeError";
    }
  }
  try {
    req.stream.destroy();
  } catch (e) {
    answer = `${answer} | destroy ${e instanceof TypeError ? (e as Error).message : "?"}`;
  }
  res.writeHead(200, { "content-type": "text/plain" });
  res.end(`${answer} | args-evaluated=${evaluated}`);
});

server.listen(0, () => {
  console.log("listening");
  process.stderr.write(`PORT ${server.address().port}\n`);
});
