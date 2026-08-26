// @exit: 1
// An unhandled 'error' THROWS its payload (Node's contract) even when the
// emit that carries it runs through an override — the override's own code
// before the forward still executes.
import { EventEmitter } from "node:events";

class W extends EventEmitter {
  emit(event: string, ...args: unknown[]): boolean {
    console.log("emitting", event);
    return super.emit(event, ...args);
  }
}

const w = new W();
w.on("error", (e: Error) => console.log("caught", e.message));
console.log(w.emit("error", new Error("first")));

const w2 = new W();
try {
  w2.emit("error", new TypeError("catchable"));
} catch (e) {
  console.log("threw", e instanceof TypeError, (e as Error).message);
}
console.log("before unhandled");
w2.emit("error", new Error("second"));
console.log("unreached");
