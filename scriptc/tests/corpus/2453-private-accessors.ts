// #private accessors: get/set pairs collect as "get:#x"/"set:#x" — brand-checked property syntax over the same direct dispatch as private methods. Reads call the getter, writes the setter, compound assignment and ++/-- run get-then-set (observably: a logging pair records the order), getter-only privates serve read-only surfaces, and a throwing private getter is an ordinary catchable error.
class Gauge {
  #level = 10;
  #trace: string[] = [];
  get #pct(): number {
    this.#trace.push("get");
    return this.#level;
  }
  set #pct(v: number) {
    this.#trace.push(`set${v}`);
    this.#level = v;
  }
  tick(): number {
    this.#pct += 5;
    this.#pct++;
    this.#pct = this.#pct * 2;
    return this.#level;
  }
  trace(): string {
    return this.#trace.join(",");
  }
}
const g = new Gauge();
console.log(g.tick());
console.log(g.trace());

// Getter-only: a computed read-only surface over private state.
class Circle {
  #r: number;
  constructor(r: number) {
    this.#r = r;
  }
  get #area(): number {
    return Math.round(this.#r * this.#r * 3.14159);
  }
  grow(): number {
    this.#r += 1;
    return this.#area;
  }
}
const circ = new Circle(2);
console.log(circ.grow(), circ.grow());

// Accessors and methods compose: the setter validates through a private
// method and throws a real, catchable error.
class Clamp {
  #v = 0;
  #check(n: number): number {
    if (n < 0) throw new RangeError("negative");
    return n;
  }
  get #value(): number {
    return this.#v;
  }
  set #value(n: number) {
    this.#v = this.#check(n);
  }
  put(n: number): string {
    try {
      this.#value = n;
      return `ok:${this.#value}`;
    } catch (e) {
      if (e instanceof RangeError) return `err:${e.message}`;
      return "?";
    }
  }
}
const cl = new Clamp();
console.log(cl.put(4));
console.log(cl.put(-1));
console.log(cl.put(7));
