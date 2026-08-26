// #private STATICS: `static #field` is a module global assigned at the class statement's position (static blocks included — they run in member order, writing through the declaring class's own name), `static #method` is an ordinary module function `%C.static:#m`, and generic private statics monomorphize per call site. Access always spells the declaring class's name — exactly the surface tsc admits for privates.
class Registry {
  static #serial = 0;
  static #prefix = "id-";
  static #next(): number {
    Registry.#serial = Registry.#serial + 1;
    return Registry.#serial;
  }
  static {
    Registry.#serial = 10;
  }
  static issue(): string {
    return Registry.#prefix + Registry.#next();
  }
  static #brand<T>(v: T): string {
    return `${Registry.#prefix}${typeof v}`;
  }
  static brands(): string {
    return Registry.#brand(1) + "/" + Registry.#brand("s");
  }
}
console.log(Registry.issue());
console.log(Registry.issue());
console.log(Registry.brands());

// Instance methods reach private statics through the class name.
class Counter {
  static #count = 0;
  bump(): number {
    Counter.#count = Counter.#count + 1;
    return Counter.#count;
  }
  static read(): number {
    return Counter.#count;
  }
}
const c1 = new Counter();
const c2 = new Counter();
console.log(c1.bump(), c2.bump(), c1.bump());
console.log(Counter.read());

// Async private statics ride the async-static machinery.
class Loader {
  static #stamp = "v1";
  static async #fetch(key: string): Promise<string> {
    return `${Loader.#stamp}:${key}`;
  }
  static async load(key: string): Promise<string> {
    const raw = await Loader.#fetch(key);
    return raw.toUpperCase();
  }
}
async function main(): Promise<void> {
  console.log(await Loader.load("cfg"));
}
void main();
