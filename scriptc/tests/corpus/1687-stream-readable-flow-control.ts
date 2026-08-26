// pause()/resume() and their events: 'pause' emits synchronously,
// 'resume' on its tick; a paused stream buffers pushes; isPaused and
// readableFlowing track each transition.
import { Readable } from "node:stream";

const r = new Readable({ read() {} });
const seen: string[] = [];
r.on("data", (c: Buffer) => {
  seen.push(c.toString());
  console.log("data:", c.toString());
  if (c.toString() === "one") {
    r.pause();
    console.log("paused inside data:", r.isPaused());
  }
});
r.on("pause", () => console.log("pause event"));
r.on("resume", () => console.log("resume event"));
r.on("end", () => console.log("end:", seen.join(",")));
r.push("one");
r.push("two");
setTimeout(() => {
  console.log("timer: still paused:", r.isPaused());
  r.resume();
  r.push(null);
}, 5);
console.log("tail:", String(r.readableFlowing));
