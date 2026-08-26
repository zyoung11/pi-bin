// #private statics on CLASS EXPRESSIONS bound to a const: the binding IS
// the class (a const initialized by the class expression can never hold a
// descendant), so `C.#m()` calls, `C.#f` reads, and `C.#f = v` writes all
// resolve exactly — including from constructors and instance methods.
// Static field initializers stay self-contained (referencing the outer
// const during them is Node's TDZ), so the #private calls run afterwards.
const C = class {
  static #scale = 3;
  static #mul(n: number): number {
    return n * C.#scale;
  }
  static apply(n: number): number {
    return C.#mul(n);
  }
  static rescale(s: number): number {
    C.#scale = s;
    return C.#scale;
  }
  #v: number;
  constructor(v: number) {
    this.#v = C.#mul(v);
  }
  read(): number {
    return this.#v;
  }
};
console.log(C.apply(5));
console.log(new C(2).read());
console.log(C.rescale(7));
console.log(C.apply(5));

// The parenthesized (non-whole-initializer) spelling binds the same way.
const P = (class {
  static #hidden = "quiet";
  static tag(): string {
    return P.#hidden.toUpperCase();
  }
});
console.log(P.tag());
