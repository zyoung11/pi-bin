// once semantics and removal: a once listener leaves BEFORE it runs (a
// nested emit cannot re-enter it), removeListener removes the LAST
// matching occurrence, off is an alias, and removing an unknown listener
// is a no-op.
import { EventEmitter } from "node:events";

const e = new EventEmitter();
const log: string[] = [];
e.once("boot", () => {
  log.push("first");
  e.emit("boot");
});
e.once("boot", () => log.push("second"));
e.emit("boot");
console.log(log.join(","), e.listenerCount("boot"));

// removeListener takes the LAST matching occurrence.
const seen: string[] = [];
const fA = () => { seen.push("A"); };
const fB = () => { seen.push("B"); };
e.on("dup", fA);
e.on("dup", fB);
e.on("dup", fA);
console.log(e.listenerCount("dup", fA));
e.removeListener("dup", fA);
e.emit("dup");
console.log(seen.join(","));

// off is removeListener; removing a never-registered listener is a no-op.
e.off("dup", fA);
e.off("dup", fA);
e.emit("dup");
console.log(seen.join(","), e.listenerCount("dup"));

// A once listener registered then removed never fires.
const never = () => { log.push("never"); };
e.once("gone", never);
e.removeListener("gone", never);
console.log(e.emit("gone"), log.join(","));
