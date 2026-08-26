// An empty array-literal ternary arm has no type of its own (tsc infers
// never[]); it adopts the sibling arm's array type — the conditional-spread
// idiom [...(c ? [x] : [])] and friends. Values arrive through parameters
// so tsc's flow analysis can't collapse the filled arm.
function build(stdin: string | undefined): string[] {
  return [...(stdin ? [stdin] : []), "tail"];
}
const withHave = build("x");
console.log(withHave.length, withHave.join(","));
const withMissing = build(undefined);
console.log(withMissing.length, withMissing.join(","));

// Both orders: the empty arm may be the true side.
function flip(gone: string | undefined): string[] {
  return [...(gone ? [] : ["fallback"])];
}
console.log(flip(undefined).join(","));
console.log(flip("present").length);

// Directly in expression position, no spread involved.
function direct(s: string | undefined): number[] {
  const d = s ? [s.length] : [];
  return d;
}
console.log(direct("abc").length, direct("abc")[0]);
console.log(direct(undefined).length);

// Nested in call arguments.
function count(xs: number[]): number {
  return xs.length;
}
function viaArg(flag: boolean): number {
  return count(flag ? [1, 2] : []);
}
console.log(viaArg(true), viaArg(false));

// Record elements.
function rows(flag: boolean): { id: number }[] {
  return [...(flag ? [{ id: 1 }] : []), { id: 2 }];
}
for (const r of rows(true)) console.log(r.id);
console.log(rows(false).length);

// Union-element targets: the filled arm's literal builds as the slot's
// element type (tsc types [s] as string[] covariantly; the tagged
// representation is built, not coerced) — the stdin-images pattern.
type Ref = string | number;
function refs(s: string | undefined): Ref[] {
  const seed: Ref[] = [7];
  return [...(s ? [s] : []), ...seed];
}
console.log(refs("in").length, refs(undefined).length);
console.log(refs("in")[0] === "in", refs(undefined)[0] === "in");

