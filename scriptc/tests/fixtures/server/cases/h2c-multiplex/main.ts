/* Concurrent multiplexing over one h2c session — three streams opened
 * back-to-back, each echoing its path into the body. The client sorts
 * its collected results before printing so the compared stdout is
 * deterministic regardless of stream-completion interleave. */
import * as http2 from "node:http2";

const server = http2.createServer();
server.on("stream", (stream: http2.ServerHttp2Stream, headers: http2.IncomingHttpHeaders) => {
  const path = headers[":path"];
  const p = typeof path === "string" ? path : "?";
  stream.respond({ ":status": 200 });
  stream.end(`body${p}`);
});

server.listen(0, () => {
  const client = http2.connect(`http://localhost:${server.address().port}`);
  const results: string[] = [];
  let done = 0;
  const total = 3;
  for (let n = 0; n < total; n++) {
    const req = client.request({ ":path": `/s${n}` });
    req.setEncoding("utf8");
    let data = "";
    req.on("data", (d: any) => { data += d; });
    req.on("end", () => {
      results.push(data);
      if (++done === total) {
        results.sort();
        for (const r of results) console.log(r);
        client.close();
        server.close();
      }
    });
  }
});
