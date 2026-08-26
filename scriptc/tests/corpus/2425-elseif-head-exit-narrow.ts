// An exiting null guard heading an if/else-if chain narrows every read after the whole statement, including flows through a middle arm that never mentions the value.
interface P { readonly v: number; }
function pick(x: P | null, flag: boolean): number {
  let n = 1;
  if (x === null) {
    return -1;
  } else if (flag) {
    n = 2;
  }
  return x.v + n;
}
console.log(pick(null, true));
console.log(pick({ v: 10 }, true));
console.log(pick({ v: 10 }, false));
