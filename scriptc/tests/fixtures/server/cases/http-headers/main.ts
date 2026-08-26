/* Header reads, both forms: the property read (req.headers.via — a
 * lowercased lookup of a mixed-case wire header) and the element read
 * (req.headers["x-echo-one"]), each `string | undefined` — absent
 * headers narrow to the undefined arm exactly like process.env. The
 * response echoes through setHeader. */
import { createServer } from "node:http";

const server = createServer((req, res) => {
  const one = req.headers["x-echo-one"];
  const via = req.headers.via;
  const missing = req.headers["x-not-sent"];
  console.log(`one=${one !== undefined ? one : "absent"}`);
  console.log(`via=${via !== undefined ? via : "absent"}`);
  console.log(`missing=${missing !== undefined ? missing : "absent"}`);
  if (one !== undefined) {
    res.setHeader("x-echo-back", one);
  }
  res.end("ok");
  if (req.url === "/quit") {
    server.close(() => console.log("server closed"));
  }
});

server.listen(0, () => {
  console.log("listening");
  process.stderr.write(`PORT ${server.address().port}\n`);
});
