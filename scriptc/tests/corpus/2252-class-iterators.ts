// Class iterables: a `[Symbol.iterator]()` method (the computed-name
// well-known-symbol slot) plus `next()` drive for-of, array spreads,
// call spreads, and array destructuring through the real protocol —
// ordinary method calls, no eager materialization in for-of (break stops
// the iteration where it stands). Folded computed METHOD names
// (`["computed"]() {}`) are ordinary methods.
class Range {
  private i: number;
  private limit: number;
  constructor(limit: number) {
    this.i = 0;
    this.limit = limit;
  }
  next() {
    const v = this.i++;
    return { value: v, done: v >= this.limit };
  }
  [Symbol.iterator]() {
    return this;
  }
}

// for-of: fresh iterator per statement, declared and pre-declared heads,
// break/continue.
let acc = "";
for (const v of new Range(4)) acc += `${v},`;
console.log(acc);
let w: number;
let sum = 0;
for (w of new Range(5)) {
  if (w === 1) continue;
  if (w === 4) break;
  sum += w;
}
console.log(sum, w!);

// A SEPARATE iterator class (the non-self-iterator shape).
class Evens {
  [Symbol.iterator]() {
    return new EvenIter(3);
  }
}
class EvenIter {
  private n = 0;
  private count: number;
  constructor(count: number) {
    this.count = count;
  }
  next() {
    const out = this.n * 2;
    this.n++;
    return { value: out, done: this.n > this.count };
  }
}
console.log([...new Evens()].join("|"));

// Spreads: array literals (union elements included) and call rests.
class Letters {
  private i = 0;
  private src = ["a", "b", "c"];
  next() {
    const done = this.i >= this.src.length;
    return { value: done ? "" : this.src[this.i++], done };
  }
  [Symbol.iterator]() {
    return this;
  }
}
const mixed: (number | string)[] = [...new Range(2), ...new Letters()];
console.log(mixed.length, `${mixed[0]}${mixed[2]}`);
function count(...xs: number[]): number {
  return xs.length;
}
console.log(count(...new Range(3)));

// Array destructuring: one next() per position (holes consume a step),
// rest drains the tail.
const [d0, , d2] = new Range(9);
console.log(d0, d2);
const [head, ...tail] = new Range(5);
console.log(head, tail.join(""));

// Folded computed method names are ordinary methods.
const K = "prefix";
class Named {
  ["computed"]() {
    return "yes";
  }
  [K]() {
    return "folded";
  }
}
console.log(new Named().computed(), new Named().prefix());
