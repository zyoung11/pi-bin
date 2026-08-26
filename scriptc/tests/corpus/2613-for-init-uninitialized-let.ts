// For-init declarators are LOCALS: an uninitialized `let` in a for-loop
// head must never be claimed by the no-storage binding families (the
// dead-unmappable rule saw "never read, unmappable implicit-any type" and
// answered yes at 0.0.10, leaving lowerVarDeclList's for-init contract —
// a declarator always lowers to a statement — violated: "lowerer bug:
// for-init declarator resolved to a global"). The bare head is the
// 1-line ICE repro (nestedBlockScopedBindings7/8); the closure and
// preceding-binding variants are the masking edges that hid it.
for (let x; false;) {}
for (let y; false;) {
  const f = () => y;
  void f;
}
let z;
void z;
for (let w; false;) {}
let ran = 0;
for (let i = 0; i < 3; i++) ran++;
console.log("ran", ran);
console.log("done");
