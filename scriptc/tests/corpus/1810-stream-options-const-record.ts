// Options objects through VARIABLES: the option walk follows a chain of
// const-initialized bindings to the object literal, so scalars and inline
// callbacks lower exactly as if written at the construction site — and
// `new Readable(undefined)` takes Node's `if (options)` path (all
// defaults). The callbacks capture the DECLARATION scope's bindings (an
// ancestor scope of every use), so `r` resolves identically.
import { Readable, Writable } from "node:stream";

const parts = ["one", "two"];
let i = 0;
const readableOpts = {
  highWaterMark: 4,
  read: () => {
    r.push(i < parts.length ? parts[i++]! : null);
  },
};
const aliased = readableOpts;
const r = new Readable(aliased);
console.log("hwm:", r.readableHighWaterMark);
const got: string[] = [];
r.on("data", (c: Buffer) => got.push(c.toString()));
r.on("end", () => {
  console.log("end:", got.join("|"));
  // Sequence the default-options stream AFTER this one ends: cross-stream
  // tick interleaving is scheduler timing, not contract.
  const bare = new Readable(undefined);
  console.log("bare hwm:", bare.readableHighWaterMark);
  bare.push(null);
  bare.resume();
  bare.on("end", () => console.log("bare end"));
});

const writableOpts = {
  highWaterMark: 2,
  write(chunk: Buffer, enc: string, cb: () => void) {
    console.log("w:", chunk.toString(), enc);
    cb();
  },
};
const w = new Writable(writableOpts);
console.log("whwm:", w.writableHighWaterMark);
w.write("payload");
w.end(() => console.log("finished"));
console.log("sync");
