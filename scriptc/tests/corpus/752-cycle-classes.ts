// Class instance cycle A -> B -> A, built inside A's constructor (no null
// needed: B receives its owner as a constructor argument). Reading fields
// all the way around the cycle proves both objects are live and correctly
// linked; the sanitized lane asserts every dropped pair is collected.
class B {
  owner: A;
  tag: string;
  constructor(owner: A, tag: string) {
    this.owner = owner;
    this.tag = tag;
  }
}

class A {
  b: B;
  constructor(tag: string) {
    this.b = new B(this, tag);
  }
}

function spin(tag: string): string {
  const a = new A(tag);
  return a.b.owner.b.tag; // around the cycle and back
}

console.log(spin("one"));
for (let i = 0; i < 300; i = i + 1) {
  spin(`x${i}`);
}
console.log(spin("two"));
