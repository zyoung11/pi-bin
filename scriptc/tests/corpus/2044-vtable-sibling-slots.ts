// Sibling branches of ONE hierarchy each declaring the SAME virtual
// method name: each branch's root-most declarer owns its own vtable slot
// (the slot member names disambiguate by occurrence), and dispatch through
// either branch's static type reaches the right override — previously the
// shared root's vtable struct emitted duplicate members.
class Root {
  tag() {
    return "root";
  }
}

class A extends Root {
  m() {
    return "A";
  }
}
class A2 extends A {
  m() {
    return "A2";
  }
}
class B extends Root {
  m() {
    return "B";
  }
}
class B2 extends B {
  m() {
    return "B2";
  }
  tag() {
    return "b2";
  }
}

const asA: A[] = [new A(), new A2()];
const asB: B[] = [new B(), new B2()];
console.log(asA.map((a) => a.m()).join(","), asB.map((b) => b.m()).join(","));

// The root's own virtual method dispatches across both branches.
const roots: Root[] = [new Root(), new A2(), new B2()];
console.log(roots.map((r) => r.tag()).join(","));

// Three-way: a third branch reusing the name again.
class C extends Root {
  m() {
    return "C";
  }
}
class C2 extends C {
  m() {
    return super.m() + "2";
  }
}
const asC: C[] = [new C(), new C2()];
console.log(asC.map((c) => c.m()).join(","));
