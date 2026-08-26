// #private GENERATOR methods (`*#walk()`): privates never dispatch dynamically, so the body composes the ordinary generator machinery with a `this` param and every call is a direct entry through the gen-spawn wrapper. The path-walker shape — a recursive private generator over private state — plus yield* delegation, .next/.return/.throw driving, and for-of with break (IteratorClose runs finallys) all match Node.
class Tree {
  #name: string;
  #kids: Tree[];
  constructor(name: string, kids: Tree[] = []) {
    this.#name = name;
    this.#kids = kids;
  }
  *#steps(prefix: string): Generator<string, number, undefined> {
    yield prefix + this.#name;
    let n = 1;
    for (const k of this.#kids) {
      for (const s of k.#steps(prefix + "  ")) {
        yield s;
        n++;
      }
    }
    return n;
  }
  *#walk(): Generator<string, void, undefined> {
    yield* this.#steps("");
  }
  paths(): string[] {
    const out: string[] = [];
    for (const s of this.#walk()) out.push(s);
    return out;
  }
  driveManually(): void {
    const g = this.#steps(">");
    const first = g.next().value;
    if (typeof first === "string") console.log(first);
    const second = g.next().value;
    if (typeof second === "string") console.log(second);
    // .return closes early: done true, the passed value comes back.
    const closed = g.return(99);
    const cv = closed.value;
    console.log(closed.done === true, typeof cv === "number" ? cv : -1);
    // .throw into a suspended private generator unwinds to the consumer.
    const g2 = this.#steps("!");
    const opener = g2.next().value;
    if (typeof opener === "string") console.log(opener);
    try {
      g2.throw(new Error("stop"));
    } catch (e) {
      if (e instanceof Error) console.log("caught:", e.message);
    }
  }
}
const t = new Tree("root", [new Tree("a", [new Tree("x")]), new Tree("b")]);
for (const p of t.paths()) console.log(p);
t.driveManually();

// for-of break runs IteratorClose — the generator's finally observes it.
class Feed {
  #closedAt = -1;
  *#emit(): Generator<number, void, undefined> {
    let i = 0;
    try {
      while (true) yield i++;
    } finally {
      this.#closedAt = i;
    }
  }
  takeTwo(): string {
    const got: number[] = [];
    for (const v of this.#emit()) {
      got.push(v);
      if (got.length === 2) break;
    }
    return `${got.join("+")}@${this.#closedAt}`;
  }
}
console.log(new Feed().takeTwo());

// The next-channel: a private generator consuming .next(v) values.
class Averager {
  #seen = 0;
  *#pump(): Generator<number, void, number> {
    let total = 0;
    while (this.#seen < 3) {
      const v: number = yield total;
      total += v;
      this.#seen++;
    }
  }
  run(): string {
    const g = this.#pump();
    g.next(0); // the priming resume's value is discarded, like Node
    const afterTen = g.next(10).value;
    const afterFour = g.next(4).value;
    const done = g.next(1).done;
    return `${typeof afterTen === "number" ? afterTen : -1},${typeof afterFour === "number" ? afterFour : -1},${done === true}`;
  }
}
console.log(new Averager().run());
