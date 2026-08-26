// The URL-string first argument to the http/https clients — Node's other
// client spelling, and the one a from-scratch client reaches for before
// it learns the options object. Both modules accept a string or a URL
// object; the scheme is checked against the MODULE, so http.get of an
// https URL is ERR_INVALID_PROTOCOL rather than a silent upgrade, and an
// unparsable input is the WHATWG "Invalid URL" TypeError. Both throws are
// catchable. Everything here dials 127.0.0.1, so the test needs no
// network — the DNS story is the same code path either way.
import * as http from "node:http";

const server = http.createServer((req, res) => {
  res.end(`hi ${req.url}`);
});

server.listen(0, () => {
  const port = server.address().port;

  // the plain string form, with a query the parse must keep
  http.get(`http://127.0.0.1:${port}/one?q=1`, (res) => {
    console.log("string", res.statusCode);
    let body = "";
    res.on("data", (c) => { body += c; });
    res.on("end", () => {
      console.log("body", body);

      // a URL OBJECT reads as its href through the same parse
      const u = new URL(`http://127.0.0.1:${port}/two`);
      http.get(u, (res2) => {
        let b2 = "";
        res2.on("data", (c) => { b2 += c; });
        res2.on("end", () => {
          console.log("url object", b2);

          // request() is get() without the eager end()
          const req = http.request(`http://127.0.0.1:${port}/three`, (res3) => {
            let b3 = "";
            res3.on("data", (c) => { b3 += c; });
            res3.on("end", () => {
              console.log("request", b3);

              // the scheme is the calling module's, not the URL's
              try {
                http.get("https://127.0.0.1/nope", () => {});
              } catch (e) {
                console.log("scheme", (e as Error).message);
              }
              try {
                http.get("not a url", () => {});
              } catch (e) {
                console.log("parse", (e as Error).message);
              }
              server.close();
            });
          });
          req.end();
        });
      });
    });
  });
});
