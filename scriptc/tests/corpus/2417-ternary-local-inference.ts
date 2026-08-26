// An UN-annotated local initialized from a null-test ternary with a spread arm values the non-optional record type, both guard polarities.
type QuoteState = "idle" | "ok" | "failed";
interface Quote { readonly id: number; readonly state: QuoteState; readonly price: number; }
function missTest(q: Quote | null, fallback: Quote): Quote {
  const picked = q === null ? { ...fallback, price: 0 } : q;
  return picked;
}
function hitTest(q: Quote | null, fallback: Quote): Quote {
  const picked = q !== null ? q : { ...fallback, price: 0 };
  return picked;
}
const fb: Quote = { id: 9, state: "idle", price: 99 };
console.log(JSON.stringify(missTest({ id: 1, state: "ok", price: 5 }, fb)));
console.log(JSON.stringify(missTest(null, fb)));
console.log(JSON.stringify(hitTest({ id: 1, state: "ok", price: 5 }, fb)));
console.log(JSON.stringify(hitTest(null, fb)));
