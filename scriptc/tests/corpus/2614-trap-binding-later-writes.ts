// @exit: 1
// A trap-shaped declaration whose binding the program WRITES afterwards
// keeps ordinary storage (trapDeclRootOf): the no-storage trap stance
// would fence every write site ("assignment to 't1' (not a writable
// local or module global)" — the literalWidening corpus regression)
// where the ordinary lowering compiles them. Runtime semantics are
// unchanged either way: the initializer READ still lowers to the root's
// ReferenceError, module init unwinds there, and the writes never run —
// exactly Node's erasure semantics for `declare const`.
declare const numLiteral: 0;
console.log("before");
let t1 = numLiteral;
t1 = t1 + 42;
t1 += 1;
console.log("after", t1);
