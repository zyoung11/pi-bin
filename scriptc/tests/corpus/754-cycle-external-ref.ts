// A LIVE cycle must survive collection. The churn loop drops hundreds of
// garbage rings, overflowing the collector's root buffer and forcing
// collections mid-loop while `keep` still points into its own ring —
// printing through the kept ring afterwards proves an externally-reachable
// cycle is never collected. (The kept ring itself is freed at exit, after
// the module variable releases it, so the sanitized lane stays clean.)
class Ring {
  label: string;
  next: Ring;
  constructor(label: string) {
    this.label = label;
    this.next = this;
  }
}

function ring3(tag: string): Ring {
  const a = new Ring(`${tag}-0`);
  const b = new Ring(`${tag}-1`);
  const c = new Ring(`${tag}-2`);
  a.next = b;
  b.next = c;
  c.next = a;
  return a;
}

const keep = ring3("live");
for (let i = 0; i < 400; i = i + 1) {
  ring3(`junk${i}`);
}
console.log(keep.next.next.next.label);
console.log(keep.next.label);
