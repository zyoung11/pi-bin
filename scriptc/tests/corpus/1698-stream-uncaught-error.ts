// @exit: 1
// An unhandled stream 'error' (destroy(err) with no 'error' listener)
// throws its payload — the process crashes with exit 1 after all
// synchronous output, Node's unhandled-'error' contract.
import { Readable } from "node:stream";

const r = new Readable({ read() {} });
r.on("close", () => console.log("close before crash?"));
r.destroy(new Error("nobody listening"));
console.log("sync tail");
