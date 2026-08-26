// @tsc-decorators
// #private statics on DECORATED classes: a replacing decorator rebinds the
// class name through a mutable class value, but replacement fences any
// class with subclasses first — so the rebindable binding can only ever
// hold the declaring class object, and `Example.#m()` calls and
// `Example.#f` reads through the decorated name stay exact. Effect-only
// (void) decorators keep the direct binding and ride the same forms. The
// Node side runs tsc's ES2022 downlevel (V8 has not shipped decorators).

const log: string[] = [];

function keep(cls: typeof Example): typeof Example {
  log.push("keep:" + cls.name);
  return cls;
}

@keep
class Example {
  static #greeting = "hello";
  static #compose(who: string): string {
    return `${Example.#greeting}, ${who}`;
  }
  static greet(who: string): string {
    return Example.#compose(who);
  }
  #id: number;
  constructor(id: number) {
    this.#id = id;
  }
  tag(): string {
    return `#${this.#id}`;
  }
}
console.log(Example.greet("world"));
console.log(new Example(3).tag());
console.log(Example.name);

function observe(cls: typeof Quiet): void {
  log.push("observe:" + cls.name);
}

@observe
class Quiet {
  static #serial = 10;
  static #next(): number {
    Quiet.#serial = Quiet.#serial + 1;
    return Quiet.#serial;
  }
  static issue(): string {
    return `q${Quiet.#next()}`;
  }
}
console.log(Quiet.issue());
console.log(Quiet.issue());
console.log(log.join("|"));
