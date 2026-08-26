// Runtime string keys in object literals whose target is a PURE
// index-signature record: `{ ...m, [expr]: v }` writes through the
// signature exactly like a spread's keys — contributors apply in literal
// order (JS last-write-wins), each property's KEY evaluates before its
// VALUE, and number/boolean keys stringify (ToPropertyKey).

const m: { [k: string]: string } = { seed: "s" };
const x: { [k: string]: string } = { ...m, ["a" + "b"]: "" };
console.log(JSON.stringify(x));
console.log(Object.keys(x).join(","));

// Runtime keys with no spread at all.
const kvar = "k" + String(1);
const solo = { [kvar]: "v1" };
console.log(JSON.stringify(solo));

// Last-write-wins across spreads and runtime keys.
const y: { [k: string]: string } = { ...m, ["se" + "ed"]: "overwritten" };
console.log(JSON.stringify(y));

// Key-before-value evaluation, properties in source order.
const order: string[] = [];
function keyOf(tag: string): string {
  order.push("key:" + tag);
  return tag;
}
function valOf(tag: string): string {
  order.push("val:" + tag);
  return tag;
}
const seq: { [k: string]: string } = { [keyOf("p")]: valOf("1"), [keyOf("q")]: valOf("2") };
console.log(order.join(","), JSON.stringify(seq));

// Number keys stringify canonically and enumerate integer-first.
const num = 2;
const nkeys: { [k: string]: number } = { ["z" + "z"]: 0, [num * 5]: 1 };
console.log(Object.keys(nkeys).join(","));
