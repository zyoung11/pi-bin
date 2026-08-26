// A JS class EXTENDING a base whose own collection fenced reports at
// COMPILE time: the derived statement evaluates its heritage at module
// init (top-level declarations always execute), and the base's fence is
// the compiler's own — Node defines the base fine and runs on — so a
// deferred trap there would be a manufactured divergence, not the
// Node-parity JS deferral is licensed by (classFieldSuperAccessibleJs2:
// the deferred binary printed nothing where Node prints five lines).
// The report names the BASE's real blocker, not the extends edge. Leaf and
// derived-only poisoned classes stay deferred (errors.test's shadowing pins).
class C {
  constructor() {
    this.foo = () => {
      console.log("called arrow");
    };
  }
  foo() {
    console.log("called method");
  }
}

class D extends C {
  foo() {
    console.log("SUPER:");
    super.foo();
    console.log("THIS:");
    this.foo();
  }
}

const obj = new D();
obj.foo();
D.prototype.foo.call(obj);
