// Loose `== null` / `!= null` — the one coercing comparison with static semantics: it matches EXACTLY null and undefined. Against `T | undefined` it answers the undefined arm, against `T | null` the null arm, against a both-units union either, both operand orders — and never coerces the literal into the union.
const nums = [10, 20, 30];
const gone = nums.find((n) => n > 99);
const there = nums.find((n) => n > 15);
console.log(gone == null, null == gone, gone != null, null != gone);
console.log(there == null, null == there, there != null, null != there);
function nullable(flag: boolean): number | null {
  return flag ? 5 : null;
}
console.log(nullable(true) == null, nullable(false) == null);
console.log(nullable(true) != null, nullable(false) != null);
const both: string | null | undefined = nums.length === 3 ? null : "x";
console.log(both == null, both != null, null == both, null != both);
if (gone == null) {
  console.log("loose null caught the undefined miss");
}
if (nullable(false) == null) {
  console.log("loose null caught the null return");
}
