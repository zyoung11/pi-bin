// The namespace-member spellings: new events.EventEmitter(), extends
// events.EventEmitter, and instanceof events.EventEmitter all resolve to
// the same runtime class as the named import.
import * as events from "node:events";
import { EventEmitter } from "node:events";

const e = new events.EventEmitter();
e.on("hi", (n: number) => console.log("plain", n));
e.emit("hi", 1);

class Sub extends events.EventEmitter {
  go(): void {
    this.emit("hi", 5);
  }
}
const s = new Sub();
s.on("hi", (n: number) => console.log("sub", n));
s.go();
console.log(s instanceof events.EventEmitter, e instanceof EventEmitter);
console.log(e instanceof Sub, new EventEmitter() instanceof events.EventEmitter);
