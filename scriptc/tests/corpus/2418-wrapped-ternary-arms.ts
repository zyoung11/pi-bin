// Syntactic wrappers around a narrowed ternary arm — parens, double parens, as, non-null assertion, satisfies, and a parenthesized test — all still read the narrowed value.
type QuoteState = "idle" | "ok" | "failed";
interface Quote { readonly id: number; readonly state: QuoteState; readonly price: number; }
function viaParens(q: Quote | null, fallback: Quote): number {
  const picked = q === null ? { ...fallback, price: 0 } : (q);
  return picked.price + picked.id;
}
function viaDoubleParens(q: Quote | null, fallback: Quote): number {
  const picked = q === null ? { ...fallback, price: 0 } : ((q));
  return picked.price + picked.id;
}
function viaAs(q: Quote | null, fallback: Quote): number {
  const picked = q === null ? { ...fallback, price: 0 } : (q as Quote);
  return picked.price + picked.id;
}
function viaAssert(q: Quote | null, fallback: Quote): number {
  const picked = q === null ? { ...fallback, price: 0 } : q!;
  return picked.price + picked.id;
}
function viaSatisfies(q: Quote | null, fallback: Quote): number {
  const picked = q === null ? { ...fallback, price: 0 } : (q satisfies Quote);
  return picked.price + picked.id;
}
function testedParens(q: Quote | null, fallback: Quote): number {
  const picked = (q) === null ? { ...fallback, price: 0 } : q;
  return picked.price + picked.id;
}
const fb: Quote = { id: 9, state: "idle", price: 99 };
const hit: Quote = { id: 1, state: "ok", price: 5 };
console.log(viaParens(hit, fb), viaParens(null, fb));
console.log(viaDoubleParens(hit, fb), viaDoubleParens(null, fb));
console.log(viaAs(hit, fb), viaAs(null, fb));
console.log(viaAssert(hit, fb), viaAssert(null, fb));
console.log(viaSatisfies(hit, fb), viaSatisfies(null, fb));
console.log(testedParens(hit, fb), testedParens(null, fb));
