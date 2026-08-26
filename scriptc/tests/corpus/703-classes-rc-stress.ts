// RC torture: objects created/dropped in loops, ref-typed fields reassigned
// repeatedly, objects inside closures, objects holding objects (acyclic).
class Leaf {
  tag: string;
  constructor(tag: string) {
    this.tag = tag;
  }
}
class Pair {
  left: Leaf;
  right: Leaf;
  constructor(left: Leaf, right: Leaf) {
    this.left = left;
    this.right = right;
  }
  swap(): void {
    const t = this.left;
    this.left = this.right;
    this.right = t;
  }
  show(): string {
    return `(${this.left.tag}|${this.right.tag})`;
  }
}
let pair = new Pair(new Leaf("a"), new Leaf("b"));
console.log(pair.show());
pair.swap();
console.log(pair.show());
for (let i = 0; i < 5; i++) {
  pair.left = new Leaf(`L${i}`); // old leaf dies each round
  pair = new Pair(pair.left, new Leaf(`R${i}`)); // old pair dies too
}
console.log(pair.show());

class Holder {
  payload: string;
  constructor(payload: string) {
    this.payload = payload;
  }
}
let keeper = new Holder("initial");
for (let i = 0; i < 5; i++) {
  keeper = new Holder(`gen-${i}`);
  keeper.payload += "!";
}
console.log(keeper.payload);

function stash(h: Holder): () => string {
  return () => h.payload;
}
let readLast = stash(keeper);
for (let i = 0; i < 3; i++) {
  const temp = new Holder(`temp${i}`);
  readLast = stash(temp); // previous closure + its captured Holder die
}
console.log(readLast());

// deep nesting: three levels of object fields, swapped and dropped
class Box3 {
  inner: Pair;
  constructor(inner: Pair) {
    this.inner = inner;
  }
}
let box = new Box3(pair);
for (let i = 0; i < 3; i++) {
  box = new Box3(new Pair(new Leaf(`x${i}`), new Leaf(`y${i}`)));
  box.inner.swap();
}
console.log(box.inner.show());
