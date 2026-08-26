// Overriding emit() in the forwarding shape: the override runs for every
// dispatch — direct calls, this.emit from methods, and calls through a
// base-typed binding (a plain EventEmitter alongside stays on the runtime
// fast path) — return values pass through, and super.emit reaches the
// real emitter.
import { EventEmitter } from "node:events";

class Logged extends EventEmitter {
  count = 0;
  emit(event: string, ...args: unknown[]): boolean {
    this.count++;
    console.log("logged", event);
    return super.emit(event, ...args);
  }
  bump(n: number): void {
    this.emit("bump", n);
  }
}

function fire(e: EventEmitter): boolean {
  return e.emit("tick", 5);
}

const plain = new EventEmitter();
const l = new Logged();
plain.on("tick", (n: number) => console.log("plain", n));
l.on("tick", (n: number) => console.log("sub", n));
console.log(fire(plain));
console.log(fire(l));

// No listener: the override still runs; super.emit answers false.
console.log(l.emit("nobody"));

// this.emit inside a method dispatches through the override too.
l.on("bump", (n: number) => console.log("bump", n));
l.bump(7);
console.log(l.count, l instanceof EventEmitter);
