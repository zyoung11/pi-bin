// The emit-override fences: only the FORWARDING SHAPE lowers — a rest
// parameter doing anything else names the rule; the other EventEmitter
// members keep the surface fence; and meta-event registration fences
// while any comparable class overrides emit (the runtime fires meta
// events internally, past the override).
import { EventEmitter } from "node:events";

class Peeker extends EventEmitter {
  emit(event: string, ...args: unknown[]): boolean {
    console.log(args.length); // reads the rest parameter — not a forward
    return super.emit(event, ...args);
  }
}

class Wrapped extends EventEmitter {
  on(event: string, listener: (...a: unknown[]) => void): this {
    return super.on(event, listener);
  }
}

class Fine extends EventEmitter {
  emit(event: string, ...args: unknown[]): boolean {
    return super.emit(event, ...args);
  }
}

const f = new Fine();
f.on("newListener", (name: string) => console.log("meta", name));
f.emit("x");
console.log(new Peeker());
console.log(new Wrapped());
