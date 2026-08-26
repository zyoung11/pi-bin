// A kill in the then arm leaves the ELSE arm's entry narrow intact, including along an else-if chain.
interface P { readonly v: number; }
function thenElse(a: P | null, flag: boolean): number {
  let p: P | null = a;
  if (p === null) return -1;
  if (flag) {
    p = null;
  } else {
    return p.v;
  }
  return 0;
}
function chain(a: P | null, sel: number): number {
  let p: P | null = a;
  if (p === null) return -1;
  if (sel === 1) {
    return 1;
  } else if (sel === 2) {
    p = null;
  } else if (sel === 3) {
    return p.v;
  }
  if (p === null) return 0;
  return p.v;
}
console.log(thenElse({ v: 3 }, true));
console.log(thenElse({ v: 3 }, false));
console.log(chain({ v: 5 }, 1));
console.log(chain({ v: 5 }, 2));
console.log(chain({ v: 5 }, 3));
console.log(chain({ v: 5 }, 4));
