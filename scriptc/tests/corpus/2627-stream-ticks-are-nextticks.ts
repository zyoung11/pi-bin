// Stream emissions are process.nextTicks in Node (resume_,
// emitReadable_, endReadableNT ride the same FIFO as user nextTicks), so
// a user callback queued AFTER on('data') observes the flowed chunks —
// the setEncoding-with-buffered-bytes shape — and 'readable'/'end'
// interleave with nextTicks in enqueue order. Node is the oracle.
import { Readable } from "node:stream";

// setEncoding() with bytes already buffered: the re-decoded content flows
// before a nextTick registered after the 'data' subscription.
const r = new Readable({ read() {} });
r.push(Buffer.from("a"));
r.push(Buffer.from("b"));
r.setEncoding("utf8");
const chunks: string[] = [];
r.on("data", (c: string) => chunks.push(c));
process.nextTick(() => {
  console.log("nextTick-sees", JSON.stringify(chunks));
});

// A chunked multi-byte character re-assembles across the decode.
const r2 = new Readable({ read() {} });
r2.push(Buffer.from([0xf0]));
r2.push(Buffer.from([0x9f]));
r2.setEncoding("utf8");
r2.push(Buffer.from([0x8e]));
r2.push(Buffer.from([0x89]));
const chunks2: string[] = [];
r2.on("data", (c: string) => chunks2.push(c));
process.nextTick(() => {
  console.log("split-char", JSON.stringify(chunks2));
});

// FIFO interleave: ticks queued before the flow kick run before it; ones
// queued after run after the data delivery.
const r3 = new Readable({ read() {} });
r3.push(Buffer.from("x"));
r3.setEncoding("utf8");
process.nextTick(() => console.log("tick-before-subscribe"));
r3.on("data", (c: string) => console.log("data", JSON.stringify(c)));
process.nextTick(() => console.log("tick-after-subscribe"));

// 'end' rides the tick queue too: push(null) then a nextTick queued after
// the subscription still precedes 'end' (end waits for the drain + tick).
const r4 = new Readable({ read() {} });
r4.push(Buffer.from("z"));
r4.push(null);
r4.on("data", (c: Buffer) => console.log("r4-data", c.toString("utf8")));
r4.on("end", () => console.log("r4-end"));
process.nextTick(() => console.log("r4-tick"));
