// @exit: 1
// @tsc-decorators
// A DECORATED class EXPRESSION whose decoration provably throws never
// mints a class: evaluating the expression IS the ReferenceError — the
// class-level and member-level ambient forms both lower to exactly the
// read. Every evaluation would throw identically, so the once-evaluated
// restriction on class expressions does not apply.

declare var vanish: any;

console.log("before");

(
  @vanish
  class Gone {
    method() {
      return 1;
    }
  }
);

console.log("never: after expression");
