// #private STATIC CALL FORMS through the class name: `X.#m()` from static
// methods, from static field initializers, and from instance (public and
// #private) methods — the class-name receiver resolves exactly like the
// declaring class's own spelling, never the through-a-VALUE story.
class X {
  static #base = 40;
  static #m(): number {
    return X.#base + 2;
  }
  static create(): number {
    return X.#m();
  }
  static seeded = X.#m() + 1;
  #inst(): number {
    return X.#m() + 100;
  }
  viaPrivate(): number {
    return this.#inst();
  }
  viaPublic(): number {
    return X.#m() - 100;
  }
}
console.log(X.create());
console.log(X.seeded);
console.log(new X().viaPrivate());
console.log(new X().viaPublic());

// The declaring-name call form when the class HAS subclasses: the direct
// spelling stays exact (the brand lives on the declarer alone), and the
// subclass inherits the public wrapper.
class Base {
  static #stamp(): string {
    return "base-stamp";
  }
  static describe(): string {
    return Base.#stamp().toUpperCase();
  }
}
class Sub extends Base {}
console.log(Base.describe());
console.log(Sub.describe());
