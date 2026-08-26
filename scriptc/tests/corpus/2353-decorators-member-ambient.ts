// @exit: 1
// @tsc-decorators
// MEMBER decorators whose evaluation PROVABLY throws: an ambient
// decorator name (`declare let dec: any` — Node erases the declaration)
// on a method/field/accessor makes the whole class definition crash at
// the decorator-expression read, before members exist, before static
// blocks run, before anything after the class statement. The class
// registers as a shell — members never compile (they are dead code), the
// %init at the class statement IS the ReferenceError. Statements before
// the class run; nothing after does.

declare let dec: any;

function noted(target: unknown): void {
  console.log("never applied", typeof target);
}

console.log("before");

class Doomed {
  // A defined bare-identifier decorator BEFORE the ambient one: its
  // expression is a pure read (applications never run — the throw lands
  // during expression evaluation, before any application).
  @noted
  early() {
    return 1;
  }

  @dec(1)
  method1() {
    return 2;
  }

  // Everything below is dead: fancy member shapes never lower.
  @dec(2)
  field2 = 3;

  @dec(31)
  get val(): number {
    return 4;
  }

  static blocked = (console.log("never: static init"), 5);
  static {
    console.log("never: static block");
  }
}

// (Value uses of Doomed — `new`, `typeof Doomed`, `extends` — keep named
// fences: the binding provably never initializes, so compiled code could
// never legitimately reach one.)
console.log("never: after class");
