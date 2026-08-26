// Strict equality between a union and a unit literal the union LACKS, every spelling: `=== null` / `!== null` on `T | undefined`, `=== undefined` / `!== undefined` on `T | null`, both operand orders, value and condition position. === never coerces, so each is a constant answer — never a coercion into the union.
const words = ["alpha", "beta", "gamma"];
const found = words.find((w) => w.length > 4);
const absent = words.find((w) => w.length > 40);
console.log(found === null, null === found, found !== null, null !== found);
console.log(absent === null, null === absent, absent !== null, null !== absent);
if (absent === null) {
  console.log("unreachable");
} else {
  console.log("miss stays undefined, not null");
}
function pickNullable(flag: boolean): string | null {
  return flag ? "value" : null;
}
const some = pickNullable(true);
const none = pickNullable(false);
console.log(some === undefined, undefined === some, some !== undefined, undefined !== some);
console.log(none === undefined, undefined === none, none !== undefined, undefined !== none);
if (none !== undefined) {
  console.log("null is not undefined under ===");
}
// A wider union lacking null: the same constant answers.
const mixed: number | string | undefined = words.length > 2 ? undefined : "s";
console.log(mixed === null, mixed !== null, null === mixed);
