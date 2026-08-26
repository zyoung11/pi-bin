// @exit: 1
// A nullish-cast binding under a FIELD-bearing record keeps its real
// storage: only the EMPTY interned shape (an all-generic-signature
// interface) takes the no-storage nullish lowering. Claiming `value`
// here left its comma-chain and call-argument reads with no lowering at
// 0.0.10 ("the reference to 'value' (a binding form with no lowering)" —
// the narrowCommaOperator/varianceProbing corpus regressions); with
// storage the whole program COMPILES again. At runtime both sides exit 1
// after "start": Node throws TypeError reading `.inner` of null, the
// binary throws the documented representation error storing null into a
// record slot (stderr and throw position are the documented divergence;
// stdout and exit agree).
const otherValue = () => true;
console.log("start");
const value: { inner: number | string } = null as any;
function take<N extends { inner: number | string }>(n: N): void {
  void n;
}
if (typeof (otherValue(), value).inner === "number") {
  const b: number = (otherValue(), value).inner as number;
  console.log("unreachable", b);
}
take(value);
console.log("unreachable-end");
