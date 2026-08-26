// Arrays of scalar/string elements never sit ON a cycle themselves (those
// elements cannot point back at an owner — ref-element arrays, which can,
// are 533's story), but cycle MEMBERS own arrays and strings — collecting
// the cycle must free those exactly once each. Two holders cross-linked
// into a 2-cycle, each carrying nested arrays and strings; the sanitized
// lane asserts the whole structure is freed with no double-release.
class Holder {
  data: number[][];
  names: string[];
  next: Holder;
  constructor(seed: number) {
    this.data = [[seed, seed + 1], [seed + 2]];
    this.names = [`n${seed}`, `m${seed}`];
    this.next = this; // self-link until cross-linked
  }
}

function link(seed: number): number {
  const x = new Holder(seed);
  const y = new Holder(seed + 10);
  x.next = y;
  y.next = x;
  return x.next.data[0][0] + x.next.next.names.length;
}

console.log(link(1));
for (let i = 0; i < 300; i = i + 1) {
  link(i);
}
console.log(link(5));
