// #private access through a VARIABLE holding the class: a const alias
// (`const A = Box`) provably holds the declaring class object, so
// `A.#m()` calls, `A.#f` reads, and `A.#f = v` writes resolve exactly —
// local aliases, module-level aliases, and leaf-class-typed parameters
// alike. Instances constructed through the alias carry the same brand
// (instanceof through the alias answers).
class Box {
  static #scale = 10;
  static #mult(n: number): number {
    return n * Box.#scale;
  }
  #v: number;
  constructor(v: number) {
    this.#v = Box.#mult(v);
  }
  static viaLocalAlias(n: number): number {
    const A = Box;
    return A.#mult(n) + A.#scale;
  }
  static viaOuterAlias(): number {
    return Alias.#scale;
  }
  static viaParam(k: typeof Box): number {
    return k.#scale + 1;
  }
  static bump(): number {
    const A = Box;
    A.#scale = A.#scale + 1;
    return A.#scale;
  }
  read(): number {
    return this.#v;
  }
}
const Alias = Box;
const b = new Alias(2);
console.log(b.read());
console.log(Box.viaLocalAlias(3));
console.log(Box.viaOuterAlias());
console.log(Box.viaParam(Alias));
console.log(Box.bump());
console.log(Box.viaLocalAlias(3));
console.log(b instanceof Alias);
