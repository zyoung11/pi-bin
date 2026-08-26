'use strict';
// The RUNTIME tls/https createServer options record (divergence 66's
// stance, extended to the TLS servers): a non-literal options value
// reads its members at runtime — cert/key extract as Buffers or strings
// (one-element arrays too), requestCert:false / rejectUnauthorized / ca
// are Node's inert-without-client-certs members (read, dropped),
// undocumented keys drop exactly like Node drops them, and an
// undefined-valued member reads as absent. Each server listens on an
// ephemeral port and reports port>0 (Node's address() is null before
// listen — both lanes agree only once listening) then closes.
const fs = require('fs');
const tls = require('tls');
const https = require('https');

const key = fs.readFileSync('tests/fixtures/server/certs/localhost-key.pem');
const cert = fs.readFileSync('tests/fixtures/server/certs/localhost.pem');

const options = {
  key,
  cert,
  requestCert: false,       // client-cert member — inert here (divergence 55), dropped
  rejectUnauthorized: true, // its companion — dropped, like Node
  ca: fs.readFileSync('tests/fixtures/server/certs/ca.pem'), // verifies client certs; inert here
  someUndocumentedKnob: { nested: true }, // undocumented — dropped
  handshakeTimeout: undefined, // an undefined member reads as absent
};

const a = tls.createServer(options);
a.listen(0, () => {
  console.log('tls record ok', a.address().port > 0);
  a.close();

  // one-element arrays are the multi-context spelling's degenerate form
  const b = tls.createServer({ key: [key], cert: [cert] });
  b.listen(0, () => {
    console.log('tls arrays ok', b.address().port > 0);
    b.close();

    // string PEM values through the same record
    const c = https.createServer({
      key: key.toString('utf8'),
      cert: cert.toString('utf8'),
    }, (req, res) => { res.end('never'); });
    c.listen(0, () => {
      console.log('https record ok', c.address().port > 0);
      c.close();
    });
  });
});
