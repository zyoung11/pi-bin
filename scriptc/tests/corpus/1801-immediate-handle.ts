// The Immediate handle surface: hasRef() answers the live ref state,
// unref()/ref() chain and return the handle (Node's shape), methods on a
// FIRED handle are tolerated no-ops (clearImmediate of a dead handle does
// nothing, ref() cannot resurrect it), and a cleared immediate never
// fires even when cleared from an earlier immediate in the same phase.
const a = setImmediate(() => {
  console.log("a fired");
  // b already fired this phase? No — b is LATER in the queue: clearing it
  // from inside a's callback must stop it.
  clearImmediate(b);
});
const b = setImmediate(() => {
  console.log("b never fires");
});
console.log("a hasRef", a.hasRef());
a.unref();
console.log("a after unref", a.hasRef());
a.ref().unref().unref().ref();
console.log("a after chain", a.hasRef());
const c = setImmediate(() => {
  console.log("c fired");
  // a fired earlier this phase: every handle op on it is a no-op now.
  a.ref();
  console.log("dead a hasRef", a.hasRef());
  clearImmediate(a);
});
console.log("c hasRef", c.hasRef());
console.log("main done");
