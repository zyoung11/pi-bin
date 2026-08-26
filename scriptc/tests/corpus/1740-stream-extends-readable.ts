// `class Counter extends Readable` — the underscore-override authoring
// form: super({...}) plumbs the options, the overridden _read binds as
// the runtime's read callback, subclass fields live past the stream
// prefix, instanceof sees the runtime base, and the option-callback
// precedence matches Node (an options `read` shadows the method — Node
// assigns it onto the instance).
import { Readable } from "node:stream";

class Counter extends Readable {
  count = 0;
  constructor() {
    super({ highWaterMark: 4 });
  }
  _read(size: number): void {
    this.count++;
    if (this.count <= 3) this.push(`c${this.count} `);
    else this.push(null);
  }
}

const c = new Counter();
console.log("instanceof Readable:", c instanceof Readable);
console.log("hwm:", c.readableHighWaterMark);
c.on("data", (chunk: Buffer) => console.log("data:", chunk.toString()));
c.on("end", () => console.log("end, count =", c.count));
c.on("close", () => console.log("close"));
console.log("sync end");

// The options `read` wins over the class's _read (Node's instance-
// property shadowing).
class Shadowed extends Readable {
  constructor() {
    super({ read() { this.push("from-option"); this.push(null); } });
  }
  _read(): void {
    this.push("from-method");
    this.push(null);
  }
}
const s = new Shadowed();
s.on("data", (chunk: Buffer) => console.log("shadowed:", chunk.toString()));
s.on("end", () => console.log("shadowed end"));

// A ctor-less subclass: the synthesized constructor runs super() with
// default options; the underscore method still binds.
class Silent extends Readable {
  _read(): void {
    this.push(null);
  }
}
const q = new Silent();
q.on("data", () => {});
q.on("end", () => console.log("silent end"));
