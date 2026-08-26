// typeof over symbols: the folded constant on plain reads, the runtime
// tag test on union-typed values (narrowing composes — tsc types the
// branch), and typeof as a VALUE over unions with symbol arms.
const s: symbol = Symbol("s");
console.log(typeof s);

function describe(v: string | symbol): string {
  if (typeof v === "symbol") {
    return "symbol with " + (v.description ?? "(none)");
  }
  return "string " + v;
}
console.log(describe("plain"));
console.log(describe(Symbol("marked")));

function pick(v: number | symbol | undefined): string {
  if (typeof v === "undefined") return "undefined";
  if (typeof v !== "symbol") return "number " + v;
  return v.toString();
}
console.log(pick(7));
console.log(pick(Symbol("chosen")));
console.log(pick(undefined));

// typeof as a value: the tag dispatch over the arms' static answers.
const arr: (number | symbol)[] = [1, Symbol("two"), 3];
for (const v of arr) {
  console.log(typeof v);
}

// Every arm answers "symbol": the test folds to the constant.
const only: symbol = Symbol("only");
const u: symbol | symbol = only;
console.log(typeof u === "symbol");
