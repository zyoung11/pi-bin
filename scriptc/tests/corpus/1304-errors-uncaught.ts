// @exit: 1
// An uncaught Error object exits 1 like Node with all pre-throw stdout
// intact. stderr differs by design (Node prints a stack trace; scriptc
// prints "Uncaught name: message" — SEMANTICS.md divergence 11) and is
// not compared.
class FatalError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "FatalError";
  }
}
console.log("work before the throw");
console.log("more work");
throw new FatalError("unrecoverable");
