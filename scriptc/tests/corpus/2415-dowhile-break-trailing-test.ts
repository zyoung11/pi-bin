// break skips the do-while trailing test (a kill before break never reaches it); a body ending in break makes the test unreachable.
interface P { readonly v: number; }
function killBreak(q: P | null, r: P | null): number {
  let p: P | null = q;
  if (p === null) return -1;
  let n = 0;
  do {
    n += p.v;
    if (n > 3) {
      p = r;
      break;
    }
    n += 1;
  } while (p.v < 100);
  return p === null ? -2 : p.v;
}
interface Sel { readonly value: number; }
interface Model { readonly sel: Sel | null; }
function once(model: Model): number {
  let total = 0;
  do {
    if (model.sel !== null) {
      total += model.sel.value;
    }
    break;
  } while (total < 3);
  return total;
}
console.log(killBreak({ v: 2 }, { v: 9 }));
console.log(killBreak({ v: 2 }, null));
console.log(killBreak({ v: 50 }, { v: 1 }));
console.log(once({ sel: { value: 4 } }));
console.log(once({ sel: null }));
