// The https client's URL-string argument, against a localhost TLS server
// so the test needs no network. The URL form takes no options, which
// means Node's defaults — the certificate IS verified — so the fixture
// installs the suite's CA as the default trust anchor first
// (tls.setDefaultCACertificates) and dials the name the cert carries.
// The scheme is checked against the MODULE: an http URL through the
// https client is ERR_INVALID_PROTOCOL, catchably, not a plain dial.
import * as fs from "node:fs";
import * as tls from "node:tls";
import * as https from "node:https";

const ca = fs.readFileSync("tests/fixtures/server/certs/ca.pem", "utf8");
tls.setDefaultCACertificates([ca]);

const server = https.createServer({
  key: fs.readFileSync("tests/fixtures/server/certs/localhost-key.pem"),
  cert: fs.readFileSync("tests/fixtures/server/certs/localhost.pem"),
}, (req, res) => {
  res.end(`secure ${req.url}`);
});

server.listen(0, () => {
  const port = server.address().port;

  https.get(`https://localhost:${port}/one`, (res) => {
    console.log("status", res.statusCode);
    let body = "";
    res.on("data", (c) => { body += c; });
    res.on("end", () => {
      console.log("body", body);

      // the scheme is the calling module's, here the other way round
      try {
        https.get(`http://localhost:${port}/nope`, () => {});
      } catch (e) {
        console.log("scheme", (e as Error).message);
      }
      try {
        https.get("not a url", () => {});
      } catch (e) {
        console.log("parse", (e as Error).message);
      }

      // request() is get() without the eager end()
      const req = https.request(`https://localhost:${port}/two`, (res2) => {
        let b2 = "";
        res2.on("data", (c) => { b2 += c; });
        res2.on("end", () => {
          console.log("request", b2);
          server.close();
        });
      });
      req.end();
    });
  });
});
