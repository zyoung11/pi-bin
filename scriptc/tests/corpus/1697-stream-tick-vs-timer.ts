// Deferred stream emissions vs timers: the 'data' flow kick, 'end',
// 'finish', and 'close' all run on next-tick-like deferrals — BEFORE any
// due timer — and synchronous pushes inside listeners deliver in order.
import { Readable } from "node:stream";

const r = new Readable({ read() {} });
r.push("early");
setTimeout(() => console.log("timer"), 0);
r.on("data", (c: Buffer) => console.log("data:", c.toString()));
r.on("end", () => console.log("end"));
r.on("close", () => console.log("close"));
r.push(null);
console.log("tail");
