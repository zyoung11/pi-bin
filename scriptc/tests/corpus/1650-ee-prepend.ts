// prependListener / prependOnceListener: insertion at the FRONT of the
// list, once semantics preserved, mixed with appends.
import { EventEmitter } from "node:events";

const e = new EventEmitter();
const log: string[] = [];
e.on("go", () => log.push("appended"));
e.prependListener("go", () => log.push("front"));
e.prependOnceListener("go", () => log.push("front-once"));
e.on("go", () => log.push("tail"));
e.emit("go");
log.push("/");
e.emit("go");
console.log(log.join(","));
console.log(e.listenerCount("go"));

// Prepend onto an empty list is an ordinary add.
const e2 = new EventEmitter();
e2.prependListener("solo", (n: number) => console.log("solo", n));
e2.emit("solo", 9);
