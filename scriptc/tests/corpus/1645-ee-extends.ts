// class My extends EventEmitter: fields and methods beside the emitter
// prefix, this.emit from methods, upcast aliasing (a base-typed binding
// sees the same registry), and instanceof through the runtime hierarchy.
import { EventEmitter } from "node:events";

class Counter extends EventEmitter {
  total = 0;
  label: string;
  constructor(label: string) {
    super();
    this.label = label;
  }
  bump(n: number): void {
    this.total += n;
    this.emit("bump", n, this.total);
  }
}

class Loud extends Counter {
  shout(): void {
    this.emit("bump", 100, this.total + 100);
  }
}

const c = new Counter("jobs");
c.on("bump", (n: number, total: number) => console.log(`${c.label}: +${n} -> ${total}`));
c.bump(2);
c.bump(3);

// Upcast alias: registering through the base-typed binding reaches the
// SAME instance registry.
const base: EventEmitter = c;
base.on("bump", (n: number) => console.log("base saw", n));
c.bump(5);
console.log(base.listenerCount("bump"), c.total);

const l = new Loud("loud");
l.on("bump", (n: number, total: number) => console.log("loud", n, total));
l.shout();
console.log(l instanceof Loud, l instanceof Counter, l instanceof EventEmitter);
console.log(c instanceof Loud, new EventEmitter() instanceof Counter);
