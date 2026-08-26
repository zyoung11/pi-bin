// A project tsconfig with strictPropertyInitialization OFF (strict: false;
// strictNullChecks stays on — the floor): tsc no longer verifies that
// initializer-less fields are assigned in the constructor. An
// unconditionally ctor-assigned field compiles as ever (`Ok`); a field
// assigned only in a method now DEFERS like a `!` assertion (the slot
// rides `T | undefined`, reads extract — SEMANTICS.md 372), so `Bad`
// compiles too. The fence survives exactly where the deferral cannot
// carry the type: a MAP-typed field (map arms cannot join a union).

class Ok {
  n: number;
  s: string;
  constructor(n: number) {
    this.n = n;
    this.s = "ok";
  }
}

class Bad {
  v: number; // compiles: deferred init (reads NaN until assigned)
  m(): void {
    this.v = 1;
  }
}

class Worse {
  m: Map<string, number>; // fenced: no deferral union for map fields
  fill(): void {
    this.m = new Map();
  }
}

console.log(new Ok(5).n);
new Bad();
new Worse();
