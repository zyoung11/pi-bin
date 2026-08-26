// A STATIC method sharing an instance method's name must not lower a second
// body under the instance slot's name (the duplicate-"%C.m" ICE, invariant
// signature 10): statics are never collected — the instance method owns the
// name, and the static stays fence-at-use.
class C {
  static m() {}
  m() {
    return 7;
  }
}
console.log(new C().m());
