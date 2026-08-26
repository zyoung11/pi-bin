// The ServerResponse member surface: writeHead's statusMessage overload
// answering `this` (the chaining shape res.writeHead(...).end(...)), the
// writable statusCode/statusMessage properties feeding the implicit
// head, the header CRUD trio (getHeader/hasHeader/removeHeader), end's
// callback form (fires deferred, after the handler's synchronous tail —
// Node's 'finish' emit), server.listen's `return this` chaining with the
// composed address().port read off the RESULT, and the 'listening'
// event beside the listen callback. Strict ping-pong: one exchange in
// flight at a time, every line causally ordered.
import { createServer, get } from "node:http";
import type { IncomingMessage } from "node:http";

const server = createServer((req, res) => {
  if (req.url === "/chain") {
    // writeHead(status, statusMessage, headers) answers the response.
    res.writeHead(202, "Chained Along", { "x-a": "1" }).end("chained");
    return;
  }
  if (req.url === "/props") {
    res.statusCode = 404;
    res.statusMessage = "Gone Fishing";
    console.log(`srv props read back: ${res.statusCode} ${res.statusMessage}`);
    res.end("props");
    return;
  }
  if (req.url === "/crud") {
    res.setHeader("x-b", "2");
    const got = res.getHeader("x-b");
    res.setHeader("x-got", got !== undefined ? got : "missing");
    res.setHeader("x-had", res.hasHeader("X-B") ? "yes" : "no");
    res.removeHeader("x-b");
    res.setHeader("x-has-after", res.hasHeader("x-b") ? "yes" : "no");
    res.end("crud", () => console.log("srv end callback fired"));
    console.log("srv after end (before the callback)");
    return;
  }
  res.writeHead(200).end("ok");
});

function readBody(tag: string, res: IncomingMessage, done: () => void): void {
  let body = "";
  res.on("data", (chunk: Buffer) => {
    body += chunk.toString("utf8");
  });
  res.on("end", () => {
    const status = res.statusCode !== undefined ? res.statusCode : -1;
    const msg = res.statusMessage !== undefined ? res.statusMessage : "-";
    console.log(`${tag} status=${status} msg=${msg} body=${body}`);
    done();
  });
}

server.on("listening", () => console.log("listening event"));

// listen answers the server: the composed port read comes off the RESULT.
const listening = server.listen(0, () => {
  const port = listening.address().port;
  console.log(`listen callback, ports agree: ${port === server.address().port ? "yes" : "no"}`);
  get({ port, path: "/chain" }, (res1) => {
    const xa = res1.headers["x-a"];
    console.log(`chain x-a=${xa !== undefined ? xa : "-"}`);
    readBody("chain", res1, () => {
      get({ port, path: "/props" }, (res2) => {
        readBody("props", res2, () => {
          get({ port, path: "/crud" }, (res3) => {
            const got = res3.headers["x-got"];
            const had = res3.headers["x-had"];
            const after = res3.headers["x-has-after"];
            const xb = res3.headers["x-b"];
            console.log(
              `crud got=${got !== undefined ? got : "-"} had=${had !== undefined ? had : "-"} after=${after !== undefined ? after : "-"} x-b=${xb !== undefined ? xb : "-"}`,
            );
            readBody("crud", res3, () => {
              server.close(() => console.log("closed"));
            });
          });
        });
      });
    });
  });
});
