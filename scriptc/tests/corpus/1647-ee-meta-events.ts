// The meta events: 'newListener' fires BEFORE the add (the listener count
// still reads the old value), 'removeListener' fires after each removal —
// including a once listener's self-removal, BEFORE its body runs — and
// removeAllListeners removes LIFO per name, every other event before
// 'removeListener' itself.
import { EventEmitter } from "node:events";

const e = new EventEmitter();
let log: string[] = [];
e.on("newListener", (name: string) => {
  log.push(`new:${name}:${e.listenerCount(name)}`);
});
e.on("removeListener", (name: string) => log.push(`rm:${name}`));

e.on("data", () => log.push("data1"));
e.on("data", () => log.push("data2"));
e.once("data", () => log.push("data-once"));
e.emit("data");
e.emit("data");
console.log(log.join("|"));

log = [];
e.removeAllListeners("data");
console.log(log.join("|"));

log = [];
e.on("a", () => {});
e.on("a", () => {});
e.on("b", () => {});
e.removeAllListeners();
console.log(log.join("|"));
console.log(JSON.stringify(e.eventNames()));
