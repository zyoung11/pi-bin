const s: string = "abc";
const sliceRef = s.slice;
const fns: (() => number)[] = [];
// Optional params compile for direct calls AND as values through the
// inferred completed signature (corpus 1535); function-element arrays
// compile too (the REF element kind) — the fence above is the
// bound-method limit alone.
function withOptional(a?: number): void {
  console.log("a", a === undefined);
}
console.log(sliceRef(1), fns.length);
withOptional();
