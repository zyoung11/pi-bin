// The reducer shape that motivated the family: inside a
// case "got" arm, a spread-arm ternary reads the optional union
// payload directly; the update messages are field-widening literals
// ({ kind: "got", parsed: 9 } into the Msg union's got arm).
type QuoteState = "idle" | "ok" | "failed";
interface Quote { readonly id: number; readonly state: QuoteState; readonly price: number; }
interface Model { readonly quote: Quote; }
type Msg = { readonly kind: "got"; readonly parsed: number | null } | { readonly kind: "noop" };
function update(model: Model, msg: Msg): Model {
  switch (msg.kind) {
    case "got":
      return { ...model, quote: msg.parsed === null ? model.quote : { ...model.quote, state: "ok", price: msg.parsed } };
    case "noop":
      return model;
  }
}
const m: Model = { quote: { id: 1, state: "idle", price: 3 } };
console.log(JSON.stringify(update(m, { kind: "got", parsed: 9 })));
console.log(JSON.stringify(update(m, { kind: "got", parsed: null })));
console.log(JSON.stringify(update(m, { kind: "noop" })));
