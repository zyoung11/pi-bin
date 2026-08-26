// #private fields are ordinary slots under an unspellable name: initializer order interleaves with public fields exactly like Node, reads/writes/compound ops/increments ride the normal field machinery, optional (`#x?: T`) and readonly privates behave like their public twins — and NO enumeration surface sees them: util.inspect prints `C {}` for an all-private class and omits the private slots of a mixed one (they are not properties in any observable way).
import { inspect } from "node:util";

class Ledger {
  opened = 100;
  #balance = this.opened + 5;
  fees: number = this.#tally();
  #log: string[] = [];
  #tally(): number {
    return 2;
  }
  deposit(n: number): number {
    this.#balance += n;
    this.#log.push(`+${n}`);
    return this.#balance;
  }
  withdraw(n: number): number {
    this.#balance -= n;
    this.#balance--;
    this.#log.push(`-${n}`);
    return this.#balance;
  }
  history(): string {
    return this.#log.join(",");
  }
}
const l = new Ledger();
console.log(l.deposit(20));
console.log(l.withdraw(10));
console.log(l.history());
// inspect shows only the public fields, in declaration order.
console.log(inspect(l));

// All fields private: Node prints `Ghost {}`.
class Ghost {
  #a = 1;
  #b = "hidden";
  blend(): string {
    return `${this.#a}${this.#b.length}`;
  }
}
console.log(inspect(new Ghost()), new Ghost().blend());

// Optional and readonly privates.
class Cfg {
  #retries?: number;
  readonly #tag: string;
  constructor(tag: string) {
    this.#tag = tag;
  }
  arm(n: number): void {
    this.#retries = n;
  }
  describe(): string {
    const r = this.#retries;
    return `${this.#tag}:${r !== undefined ? r : -1}`;
  }
}
const c = new Cfg("cfg");
console.log(c.describe());
c.arm(3);
console.log(c.describe());

// A private field on an Error subclass: the runtime error surface (name,
// message, instanceof) is untouched, and the private slot reads normally.
class QuietError extends Error {
  #detail: string;
  constructor(detail: string) {
    super("quiet");
    this.#detail = detail;
  }
  detail(): string {
    return this.#detail;
  }
}
const qe = new QuietError("hidden");
console.log(qe.name, qe.message, qe.detail());
console.log(qe instanceof Error, qe instanceof QuietError);
try {
  throw new QuietError("thrown");
} catch (e) {
  if (e instanceof QuietError) console.log("caught", e.detail());
}

// Privates holding closures: the field value calls like any func field.
class Hook {
  #cb: (x: number) => number = (x) => x + 1;
  set(f: (x: number) => number): void {
    this.#cb = f;
  }
  fire(x: number): number {
    return this.#cb(x);
  }
}
const h = new Hook();
console.log(h.fire(1));
h.set((x) => x * 10);
console.log(h.fire(2));
