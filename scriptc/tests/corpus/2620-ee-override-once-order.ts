// The emitter surface UNDER an override: once fires once and unregisters,
// off removes by identity, prepend jumps the queue, listener ordering is
// registration order, and a handled 'error' routes through the override
// into the registered listener. The override observes every dispatch.
import { EventEmitter } from "node:events";

class Audited extends EventEmitter {
  seen: string[] = [];
  emit(event: string, ...args: unknown[]): boolean {
    this.seen.push(event);
    return super.emit(event, ...args);
  }
}

const a = new Audited();
const h = (n: number): void => console.log("h", n);
a.once("tick", (n: number) => console.log("once", n));
a.on("tick", h);
a.prependListener("tick", (n: number) => console.log("first", n));
a.emit("tick", 1);
a.emit("tick", 2);
a.off("tick", h);
a.emit("tick", 3);
console.log(a.listenerCount("tick"), a.eventNames().join(","));

// 'error' with a listener: the override sees it, the listener handles it.
a.on("error", (e: Error) => console.log("handled", e.message, e instanceof RangeError));
console.log(a.emit("error", new RangeError("soft")));
console.log(a.seen.join("|"));

// Chaining returns the receiver's own type through the override class.
const back = a.on("late", () => console.log("late")).setMaxListeners(4);
console.log(back === a, a.getMaxListeners());
back.emit("late");
