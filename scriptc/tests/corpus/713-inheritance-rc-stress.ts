// RC torture for hierarchies: loops allocating derived objects into
// base-typed locals and fields, reassignments dropping the old object,
// derived values riding unions and closures, and virtual dispatch on every
// survivor proving the right object stayed alive.
class Node {
  tag: string;
  constructor(tag: string) {
    this.tag = tag;
  }
  show(): string {
    return this.tag;
  }
}
class Chain extends Node {
  next: Node;
  constructor(tag: string, next: Node) {
    super(tag);
    this.next = next;
  }
  show(): string {
    return `${this.tag}->${this.next.show()}`;
  }
}

let head: Node = new Node("end");
for (let i = 0; i < 50; i++) {
  head = new Chain(`n${i}`, head); // old head moves into a base-typed field
}
let hops = 0;
let cur: Node = head;
while (cur instanceof Chain) {
  cur = cur.next;
  hops++;
}
console.log(hops, cur.show());

// Derived objects dropped in a loop (each iteration's garbage collects).
let acc = "";
for (let i = 0; i < 200; i++) {
  const t: Node = new Chain(`x${i}`, new Node("z"));
  if (i % 97 === 0) acc += t.show() + ";";
}
console.log(acc);

// Base-typed reassignments release the previous derived object.
let slot: Node = new Node("first");
for (let i = 0; i < 100; i++) {
  slot = i % 2 === 0 ? new Chain(`c${i}`, new Node("t")) : new Node(`p${i}`);
}
console.log(slot.show());

// Derived-into-union widening (the arm is the BASE class) and narrowing
// back out through the union's arm plus instanceof.
type MaybeNode = Node | undefined;
function wrap(give: boolean): MaybeNode {
  return give ? new Chain("u", new Node("v")) : undefined;
}
const got = wrap(true);
if (got !== undefined) {
  console.log(got.show(), got instanceof Chain);
}
console.log(wrap(false) === undefined);

// Closures capturing base-typed bindings that hold derived objects.
function makeCounter(seed: Node): () => string {
  let n = 0;
  return () => {
    n++;
    return `${seed.show()}#${n}`;
  };
}
const counter = makeCounter(new Chain("cap", new Node("t")));
console.log(counter(), counter());
