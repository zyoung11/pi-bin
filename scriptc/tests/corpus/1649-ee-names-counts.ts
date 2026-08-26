// eventNames insertion order: first registration appends, an emptied
// event's name DROPS, and a later re-add appends at the end (Node's
// _events key behavior). listenerCount answers 0 for unknown names and
// counts one listener's registrations with the fn argument.
import { EventEmitter } from "node:events";

const e = new EventEmitter();
e.on("b", () => {});
e.on("a", () => {});
e.once("c", () => {});
console.log(JSON.stringify(e.eventNames()));

e.emit("c"); // the once listener leaves; 'c' empties and drops
console.log(JSON.stringify(e.eventNames()));

e.on("c", () => {}); // re-adds at the END
console.log(JSON.stringify(e.eventNames()));

const f = () => {};
e.on("a", f);
e.on("a", f);
console.log(e.listenerCount("a"), e.listenerCount("a", f), e.listenerCount("zzz"));

e.removeAllListeners("a");
console.log(JSON.stringify(e.eventNames()), e.listenerCount("a"));
console.log(e.emit("a"), e.emit("b"));
