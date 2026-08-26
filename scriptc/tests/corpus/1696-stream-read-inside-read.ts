// this.push inside the read() option (the canonical generator shape): the
// read cb resolving `this` to the stream, refills continuing until
// push(null), and byte totals matching under flowing consumption.
import { Readable } from "node:stream";

let n = 0;
const r = new Readable({
  highWaterMark: 4,
  read() {
    n++;
    if (n <= 5) {
      this.push(`c${n}`);
    } else {
      this.push(null);
    }
  },
});
let total = 0;
const order: string[] = [];
r.on("data", (chunk: Buffer) => {
  total += chunk.length;
  order.push(chunk.toString());
});
r.on("end", () => console.log("end:", total, order.join(",")));
console.log("tail");
