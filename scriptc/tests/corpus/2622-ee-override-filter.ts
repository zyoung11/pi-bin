// A FILTERING override: emit may decline to forward (return false), the
// event parameter reads freely (comparisons, template strings, closures
// capturing it), and instance state gates the behavior — the muted-logger
// shape.
import { EventEmitter } from "node:events";

class Muted extends EventEmitter {
  muted = false;
  log: string[] = [];
  emit(event: string, ...args: unknown[]): boolean {
    const note = (): void => {
      this.log.push(`saw ${event}`);
    };
    note();
    if (this.muted && event !== "error") return false;
    if (event === "loud") console.log("LOUD PATH");
    const ok = super.emit(event, ...args);
    if (!ok) this.log.push(`${event} had no listeners`);
    return ok;
  }
}

const m = new Muted();
m.on("x", (v: string) => console.log("x", v));
console.log(m.emit("x", "a"));
m.muted = true;
console.log(m.emit("x", "b"));
m.muted = false;
m.once("loud", () => console.log("heard"));
m.emit("loud");
m.emit("ghost");
console.log(m.listenerCount("x"), m.eventNames().join(","));
console.log(m.log.join(" | "));
