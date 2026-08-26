// The TYPED half of the handle boundary: a statically-typed (req, res)
// listener BOXES into an untyped helper (canBoxFuncIntoDyn with handle
// params — the thunk validates each dyn argument back into
// IncomingMessage/ServerResponse by tag, reference identity preserved),
// and the wrapper's dyn result adapts BACK into the typed handler slot
// through the dynCheck function boundary. The exact-signature unwrap
// keeps identity: the same closure crosses out and back. (Wrong-target
// extractions are scriptc-specific throws — pinned in the dyncheck
// harness, not here: Node's `as` never checks.)
import { createServer, get, IncomingMessage, ServerResponse } from "node:http";

function hold(fn: unknown): unknown {
  return fn;
}

const typed = (req: IncomingMessage, res: ServerResponse): void => {
  res.writeHead(200, { "x-lane": "typed" }).end(`typed:${req.url}`);
};

const crossed = hold(typed);
// Exact-signature dynCheck: unwraps the SAME closure (identity, no adapter).
const back = crossed as (req: IncomingMessage, res: ServerResponse) => void;
console.log(`identity across the boundary: ${back === typed}`);

const server = createServer(back);
server.listen(0, "127.0.0.1", () => {
  get({ host: "127.0.0.1", port: server.address().port, path: "/boxed" }, (res) => {
    let body = "";
    res.on("data", (c: Buffer) => { body += c.toString("utf8"); });
    res.on("end", () => {
      console.log(`lane header: ${res.headers["x-lane"]} body: ${body}`);
      server.close();
    });
  });
});
