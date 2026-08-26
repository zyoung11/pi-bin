// Cycles THROUGH array elements — the collector case the REF element kind
// opens: an element points back at the array that owns it. Class instances
// are the way in (recursive record shapes are untypeable — SC2001), and
// arrays of cycle-capable elements allocate with collector headers so the
// trace can walk array -> element -> array. The sanitized lane asserts
// every dropped cycle is collected, exactly once.
class Self {
  siblings: Self[];
  tag: string;
  constructor(tag: string) {
    this.tag = tag;
    this.siblings = [];
  }
}

// element -> owning array (the minimal 2-cycle: arr -> s -> arr)
function ring(tag: string): number {
  const arr: Self[] = [];
  const s = new Self(tag);
  s.siblings = arr; // s points at the array...
  arr.push(s); // ...and the array owns s
  return arr.length + s.siblings.length;
}
console.log(ring("a"));
for (let i = 0; i < 300; i++) ring(`r${i}`);

// two instances cross-linked through each other's element arrays, plus an
// inner array-of-arrays hop (traced arrays as elements of traced arrays)
function cross(n: number): number {
  const x = new Self(`x${n}`);
  const y = new Self(`y${n}`);
  x.siblings.push(y);
  y.siblings.push(x);
  const nest: Self[][] = [[x], [y]];
  return nest[0][0].siblings.length + nest[1][0].siblings.length;
}
console.log(cross(0));
for (let i = 0; i < 300; i++) cross(i);

// closure-through-record elements: record arrays whose elements capture the
// array binding (record -> closure -> box -> array -> record).
type Cb = { name: string; poke: () => number };
function viaClosure(tag: string): number {
  const cbs: Cb[] = [];
  cbs.push({ name: tag, poke: (): number => cbs.length });
  return cbs[0].poke();
}
console.log(viaClosure("c"));
for (let i = 0; i < 300; i++) viaClosure(`c${i}`);

console.log("done");
