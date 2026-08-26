// @exit: 1
// The written-binding decline (trapDeclRootOf) is only as wide as its
// rationale: ordinary storage must COMPILE for declining the trap claim
// to buy anything. Here every binding's type is a recursive interface
// call shape with no static mapping, so a decline would trade the
// compiling no-storage stance for a guaranteed SC2009 on values that
// never exist (the recursiveInheritance2 regression). The bindings stay
// traps: module init throws the ambient root's ReferenceError at the
// first declaration, exactly Node, and the later write never runs (its
// statement lowers to the RHS trap's throw).
interface A { (): B; }
declare var a: A;
console.log("before");
var x = a();

interface B { (): C; }
declare var b: B;
var y = b();

interface C { (): A; }
declare var c: C;
var z = c();

x = y;
z = c();
console.log("unreachable");
