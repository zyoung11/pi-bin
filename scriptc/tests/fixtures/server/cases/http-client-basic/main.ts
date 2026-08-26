/* The http CLIENT and SERVER in one program (the mixed differential:
 * under Node this is real http.request against a real http.Server; the
 * compiled lane runs the runtime's client against the runtime's server,
 * and every log line must land in the same order). Covers: the
 * options-object GET, statusCode/headers/body reads on the response, the
 * client event order (res 'end' → req 'close' → res 'close'), a POST
 * with a headers option and end(body) (Content-Length framing both
 * ways), and http.get's eager end. Strict ping-pong: one exchange in
 * flight at a time, so every line is causally ordered. */
import { createServer, request, get } from "node:http";

const server = createServer((req, res) => {
  let body = "";
  req.on("data", (chunk: Buffer) => {
    body += chunk.toString("utf8");
  });
  req.on("end", () => {
    const ct = req.headers["content-type"];
    const cl = req.headers["content-length"];
    console.log(
      `srv ${req.method} ${req.url} ct=${ct !== undefined ? ct : "-"} cl=${cl !== undefined ? cl : "-"} body=${body}`,
    );
    if (req.url === "/post") {
      res.writeHead(201, { "x-made": "yes" });
      res.end(`got:${body}`);
      return;
    }
    if (req.url === "/quit") {
      // The CLIENT closes the server from its own 'end' (closing here
      // races the pooled-connection teardown differently between lanes).
      res.end("bye");
      return;
    }
    res.setHeader("content-type", "text/plain");
    res.end("hello client");
  });
});

function logResponse(tag: string, sc: number | undefined, ct: string | undefined, cl: string | undefined): void {
  console.log(
    `${tag} status=${sc !== undefined ? sc : -1} ct=${ct !== undefined ? ct : "-"} cl=${cl !== undefined ? cl : "-"}`,
  );
}

function stepGet(port: number): void {
  const req = request({ hostname: "127.0.0.1", port, path: "/get", method: "GET" }, (res) => {
    logResponse("cli /get", res.statusCode, res.headers["content-type"], res.headers["content-length"]);
    let body = "";
    res.on("data", (chunk: Buffer) => {
      body += chunk.toString("utf8");
    });
    res.on("end", () => console.log(`cli /get body=${body}`));
    res.on("close", () => {
      console.log("cli /get res close");
      stepPost(port);
    });
  });
  req.on("close", () => console.log("cli /get req close"));
  req.end();
}

function stepPost(port: number): void {
  const req = request(
    {
      hostname: "127.0.0.1",
      port,
      path: "/post",
      method: "POST",
      headers: { "content-type": "text/plain; charset=utf-8" },
    },
    (res) => {
      logResponse("cli /post", res.statusCode, res.headers["x-made"], res.headers["content-length"]);
      let body = "";
      res.on("data", (chunk: Buffer) => {
        body += chunk.toString("utf8");
      });
      res.on("end", () => console.log(`cli /post body=${body}`));
      res.on("close", () => {
        console.log("cli /post res close");
        stepQuit(port);
      });
    },
  );
  req.on("close", () => console.log("cli /post req close"));
  req.end("héllo wörld 😀");
}

function stepQuit(port: number): void {
  const req = get({ hostname: "127.0.0.1", port, path: "/quit" }, (res) => {
    let body = "";
    res.on("data", (chunk: Buffer) => {
      body += chunk.toString("utf8");
    });
    res.on("end", () => {
      console.log(`cli /quit body=${body}`);
      server.close(() => console.log("server closed"));
    });
  });
  req.on("error", (err) => console.log(`cli /quit error ${err.message}`));
}

server.listen(0, () => {
  console.log("listening");
  stepGet(server.address().port);
});
