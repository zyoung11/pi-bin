// `new.target` inside a class-field function expression builds a
// self-referential type through the containing class — the mapType depth
// guard fences it instead of overflowing the remote-AST walk (invariant
// signature 04).
class A {
  d = function () { return new.target; };
}
const a = new A();
console.log(typeof a.d);
