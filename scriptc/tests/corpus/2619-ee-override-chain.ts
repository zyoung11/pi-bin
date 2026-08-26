// Override chains: B extends A, both override emit — B's super.emit
// reaches A's override, A's reaches the runtime (JS's prototype chain).
// C extends B without overriding (inherits B's), a literal-name
// super.emit in a subclass METHOD dispatches to the ancestor override
// (super is static), and instances seen through base-typed bindings
// still dispatch on their dynamic class.
import { EventEmitter } from "node:events";

class A extends EventEmitter {
  emit(event: string, ...args: unknown[]): boolean {
    console.log("A sees", event);
    return super.emit(event, ...args);
  }
}
class B extends A {
  emit(event: string, ...args: unknown[]): boolean {
    console.log("B sees", event);
    return super.emit(event, ...args);
  }
}
class C extends B {
  poke(): void {
    // super of C is B: B's override answers (then A's, then the runtime).
    super.emit("poked", 1);
    // this.emit dispatches on the dynamic class — B's override again.
    this.emit("poked", 2);
  }
}

const c: EventEmitter = new C();
c.on("go", (n: number) => console.log("listener", n));
c.emit("go", 3);

const asA: A = new B();
asA.emit("go", 4);
new A().emit("go", 5);

const c2 = new C();
c2.on("poked", (n: number) => console.log("poked", n));
c2.poke();
