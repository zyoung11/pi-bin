// node:events EventEmitter basics: construction, synchronous emit in
// listener order, the unified argument tuple, emit's had-listeners
// answer, and the chaining `this` returns.
import { EventEmitter } from "node:events";

const e = new EventEmitter();
console.log(e.emit("nobody"));

e.on("job", (name: string, size: number, urgent: boolean) => {
  console.log("first:", name, size, urgent);
});
e.addListener("job", (name: string) => {
  console.log("second:", name);
});
e.on("job", () => {
  console.log("third");
});
console.log(e.emit("job", "compile", 42, true));
console.log(e.emit("job", "link", 7, false));

// Chaining: on/off/removeAllListeners/setMaxListeners return the emitter.
const same = e.on("more", () => {}) === e;
const same2 = e.removeAllListeners("more") === e;
console.log(same, same2);

// A second emitter is fully independent.
const other = new EventEmitter();
other.on("job", (name: string) => console.log("other:", name));
other.emit("job", "island", 1, true);
console.log(e.listenerCount("job"), other.listenerCount("job"));
