// The typed-lane tls options literal after the runtime-record alignment:
// ca / rejectUnauthorized (inert without requestCert — which only lowers
// as its false default) and requestCert: false DROP like Node drops
// them, undocumented keys drop when side-effect-free, and cert/key take
// strings or Buffers. Each server listens on an ephemeral port (Node's
// address() is null before listen — both lanes agree only once
// listening) and closes.
import { readFileSync } from "node:fs";
import * as tls from "node:tls";

const key = readFileSync("tests/fixtures/server/certs/localhost-key.pem", "utf8");
const cert = readFileSync("tests/fixtures/server/certs/localhost.pem", "utf8");
const ca = readFileSync("tests/fixtures/server/certs/ca.pem", "utf8");

const server = tls.createServer({
  key,
  cert,
  ca,
  requestCert: false,
  rejectUnauthorized: true,
  someUndocumentedKnob: 7,
});
server.listen(0, () => {
  console.log("constructed", server.address().port > 0);
  server.close();

  const withBuffers = tls.createServer({
    key: readFileSync("tests/fixtures/server/certs/localhost-key.pem"),
    cert: readFileSync("tests/fixtures/server/certs/localhost.pem"),
  });
  withBuffers.listen(0, () => {
    console.log("buffers", withBuffers.address().port > 0);
    withBuffers.close();
  });
});
