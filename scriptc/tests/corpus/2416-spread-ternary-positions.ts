// Null-narrowed ternaries with spread-literal arms in nested, argument, and field positions — the narrowed arm reads the payload, the spread arm builds the record.
type QuoteState = "idle" | "ok" | "failed";
interface Quote { readonly id: number; readonly state: QuoteState; readonly price: number; }
interface Model { readonly quote: Quote; readonly n: number; }
function nested(q: Quote, parsed: number | null): Quote {
  const updated: Quote = parsed === null
    ? (q.state === "ok" ? q : { ...q, state: "failed" })
    : { ...q, state: "ok", price: parsed };
  return updated;
}
function cost(q: Quote): number { return q.price; }
function argPosition(q: Quote, parsed: number | null): number {
  return cost(parsed === null ? q : { ...q, state: "ok", price: parsed });
}
function fieldPosition(model: Model, parsed: number | null): Model {
  return { ...model, quote: parsed === null ? model.quote : { ...model.quote, state: "ok", price: parsed } };
}
console.log(JSON.stringify(nested({ id: 1, state: "idle", price: 10 }, 25)));
console.log(JSON.stringify(nested({ id: 1, state: "idle", price: 10 }, null)));
console.log(JSON.stringify(nested({ id: 1, state: "ok", price: 10 }, null)));
console.log(argPosition({ id: 1, state: "idle", price: 10 }, 25));
console.log(argPosition({ id: 1, state: "idle", price: 10 }, null));
console.log(JSON.stringify(fieldPosition({ quote: { id: 1, state: "idle", price: 10 }, n: 3 }, 25)));
