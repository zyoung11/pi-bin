// Node's default stream highWaterMark is PLATFORM-SPLIT at the source
// (lib/internal/streams/state.js: `process.platform === 'win32' ?
// 16 * 1024 : 64 * 1024` since nodejs/node#52037 — the win32 arm kept
// the old 16 KiB). The runtime default, the island shim's default, and
// the getDefaultHighWaterMark fold all follow the TARGET platform, so
// this program prints 16384 on a win32 target and 65536 elsewhere —
// each differential lane agrees with its own platform's Node, no
// oracle fork needed.
import { Readable, Writable, getDefaultHighWaterMark } from "node:stream";

console.log("bytes:", getDefaultHighWaterMark(false), "objects:", getDefaultHighWaterMark(true));

const parts = ["one", "two"];
let i = 0;
const r = new Readable({
  read: () => {
    r.push(i < parts.length ? parts[i++]! : null);
  },
});
console.log("r hwm:", r.readableHighWaterMark, r.readableHighWaterMark === getDefaultHighWaterMark(false));

const got: string[] = [];
r.on("data", (c: Buffer) => got.push(c.toString()));
r.on("end", () => {
  console.log("end:", got.join("|"));
  // Sequenced AFTER the readable finishes: cross-stream tick
  // interleaving is scheduler timing, not contract (1810's stance).
  const w = new Writable({
    write(chunk: Buffer, enc: string, cb: () => void) {
      console.log("w:", chunk.toString(), enc);
      cb();
    },
  });
  console.log("w hwm:", w.writableHighWaterMark, w.writableHighWaterMark === getDefaultHighWaterMark(false));
  w.write("payload");
  w.end(() => console.log("done"));
});
