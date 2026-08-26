// instanceof across a 3-level hierarchy: positives up the chain, negatives
// across sibling branches, checker-driven narrowing after the test, and
// initialization ORDER printed (field initializers run right after super()
// returns, level by level).
function trace(tag: string, n: number): number {
  console.log("init", tag);
  return n;
}
class A {
  a: number = trace("A.a", 1);
  constructor() {
    console.log("ctor A");
  }
  kind(): string {
    return "A";
  }
}
class B extends A {
  b: number = trace("B.b", 2);
  constructor() {
    super();
    console.log("ctor B");
  }
  kind(): string {
    return "B";
  }
}
class C extends B {
  c: number = trace("C.c", 3);
  constructor() {
    super();
    console.log("ctor C");
  }
  kind(): string {
    return "C";
  }
}
class Sibling extends A {
  s: number = trace("Sibling.s", 9);
}

const c = new C();
const sib = new Sibling();
console.log(c.a, c.b, c.c, sib.s);

const asA: A = c;
const sibAsA: A = sib;
console.log(asA instanceof A, asA instanceof B, asA instanceof C);
console.log(sibAsA instanceof A, sibAsA instanceof B, sibAsA instanceof C);
console.log(c instanceof A, sib instanceof C);

// Narrowed member access: tsc types the guarded branches as the subclass.
function inspect(x: A): string {
  if (x instanceof C) {
    return `C:${x.c}:${x.kind()}`;
  }
  if (x instanceof B) {
    return `B:${x.b}`;
  }
  return `A:${x.a}`;
}
console.log(inspect(c), inspect(sib), inspect(new B()), inspect(new A()));

// Negated guard narrows the tail of the function.
function tail(x: A): number {
  if (!(x instanceof B)) {
    return x.a;
  }
  return x.b * 10;
}
console.log(tail(new A()), tail(c));

// instanceof yields a plain boolean value, usable anywhere bools are.
const flag: boolean = asA instanceof B && !(sibAsA instanceof B);
console.log(flag, asA instanceof C ? "yes" : "no");
