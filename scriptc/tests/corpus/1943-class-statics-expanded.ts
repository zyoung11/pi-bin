// The expanded honest static subset: writable static fields (module
// globals), static methods (%C.static:m module functions), reads through
// subclass names (the compile-time prototype chain), and shadowing
// redeclarations getting their OWN storage — all Node-exact.
class Config {
  static mode = "dev";
  static readonly version = "1.0";
  static banner(): string {
    return Config.mode + " v" + Config.version;
  }
}
console.log(Config.banner());
Config.mode = "prod";
console.log(Config.mode, Config.banner());

// Static state machine: writes observed across calls and reads.
class Seq {
  static n = 0;
  static next(): number {
    Seq.n = Seq.n + 1;
    return Seq.n;
  }
}
console.log(Seq.next(), Seq.next(), Seq.next(), Seq.n);

// Inheritance: a subclass READS the base's statics through the prototype
// chain; a REDECLARATION shadows with its own storage (both exact —
// resolution is per-declaration).
class B {
  static tag = "B";
  static hello(): string {
    return "hello from " + B.tag;
  }
}
class D extends B {}
class E extends B {
  static tag = "E";
}
console.log(D.tag, E.tag, B.tag);
console.log(D.hello(), E.hello());
B.tag = "B2";
console.log(D.tag, E.tag);

// Static field initializers run at the class statement's position, in
// member order, seeing earlier module state.
let stamp = 10;
class Ordered {
  static first = stamp + 1;
  static second = Ordered.first + 1;
}
console.log(Ordered.first, Ordered.second);

// Static methods calling static methods, and statics of OTHER classes.
class MathBox {
  static twice(n: number): number {
    return n * 2;
  }
  static quad(n: number): number {
    return MathBox.twice(MathBox.twice(n));
  }
}
console.log(MathBox.quad(5), MathBox.twice(Seq.next()));

// A func-typed static field called through the class name.
class Hooks {
  static onPing = (n: number): string => "pong " + n;
}
console.log(Hooks.onPing(3));
