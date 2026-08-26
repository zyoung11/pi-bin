/* The ServerResponse member surface, driven by a Node client so the WIRE
 * is the assertion: writeHead's statusMessage overload (the reason
 * phrase must appear on the status line), the chaining shapes
 * (writeHead(...).end(...), server.listen(...) answering the server),
 * the header CRUD trio, the writable statusCode/statusMessage pair
 * feeding the implicit head, end(data, cb)'s deferred callback, the
 * flat-array writeHead headers form, createServer(options, listener)
 * with joinDuplicateHeaders: true (the driver sends a repeated header;
 * the server reads it back joined ", "), and the 'listening' event. */
import * as http from "node:http";

const server = http.createServer({ joinDuplicateHeaders: true, requireHostHeader: false }, (req, res) => {
  if (req.url === "/chain") {
    res.writeHead(202, "Chained Along", { "x-a": "1" }).end("chained");
    return;
  }
  if (req.url === "/array-head") {
    // Node's flat [name, value, ...] headers form: the repeated name
    // writes one line per element (the driver sees an array).
    res.writeHead(200, ["x-list", "a", "x-list", "b"]).end("array");
    return;
  }
  if (req.url === "/props") {
    res.statusCode = 404;
    res.statusMessage = "Gone Fishing";
    console.log(`props read back: ${res.statusCode} ${res.statusMessage}`);
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
    res.end("crud", () => console.log("end callback fired"));
    console.log("after end (before the callback)");
    return;
  }
  if (req.url === "/dup") {
    const joined = req.headers["x-dup"];
    res.end(`dup=${joined !== undefined ? joined : "-"}`);
    return;
  }
  if (req.url === "/quit") {
    res.end("bye");
    server.close(() => console.log("server closed"));
    return;
  }
  res.writeHead(200).end("ok");
});

server.on("listening", () => console.log("listening event"));
const chained = server.listen(0, () => {
  console.log(`listen chained: ${chained.address().port === server.address().port ? "same port" : "different"}`);
  process.stderr.write(`PORT ${server.address().port}\n`);
});
