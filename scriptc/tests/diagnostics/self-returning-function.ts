// A function returning ITSELF has a type with no structural floor —
// mapType's depth guard answers unmappable instead of overflowing the stack
// (invariant signature 15), and the uses fence by name.
function somefn() {
  return somefn;
}
const g = somefn();
console.log(typeof g);
