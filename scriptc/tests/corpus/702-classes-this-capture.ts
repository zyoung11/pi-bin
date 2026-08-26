// Arrows inside methods capture `this` lexically (the object-box path).
class Counter {
  count: number = 0;
  step: number;
  constructor(step: number) {
    this.step = step;
  }
  makeBumper(): () => number {
    return () => {
      this.count += this.step;
      return this.count;
    };
  }
  makeReader(): () => number {
    return () => this.count;
  }
}
const c = new Counter(5);
const bump = c.makeBumper();
const read = c.makeReader();
console.log(bump(), bump(), read(), c.count);
c.count = 100;
console.log(read(), bump());

// two instances, closures stay bound to their own instance
const other = new Counter(1);
const bumpOther = other.makeBumper();
console.log(bumpOther(), bump(), other.count, c.count);

// this captured through nested arrows
class Greeter {
  greeting: string;
  constructor(greeting: string) {
    this.greeting = greeting;
  }
  makeFactory(): (name: string) => () => string {
    return (name: string) => () => `${this.greeting}, ${name}!`;
  }
}
const g = new Greeter("hello");
const forAda = g.makeFactory()("ada");
console.log(forAda());
g.greeting = "hi";
console.log(forAda());
