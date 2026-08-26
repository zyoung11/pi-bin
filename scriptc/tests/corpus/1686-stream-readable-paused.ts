// Paused-mode consumption: 'readable' scheduling, read(n) slicing across
// chunk boundaries, read() draining the rest, unshift putting bytes back,
// and read() answering null at EOF before 'end' fires.
import { Readable } from "node:stream";

const r = new Readable({ read() {} });
r.push("abcd");
r.push("efgh");
let turns = 0;
r.on("readable", () => {
  turns++;
  let c: Buffer | null;
  while ((c = r.read(3)) !== null) {
    console.log("read3:", c.toString());
    if (turns === 1 && c.toString() === "abc") {
      r.unshift(Buffer.from("AB"));
      console.log("unshifted, length:", r.readableLength);
    }
  }
  const rest = r.read();
  console.log("rest:", rest === null ? "null" : rest.toString());
});
r.on("end", () => console.log("end"));
r.push(null);
console.log("tail");
