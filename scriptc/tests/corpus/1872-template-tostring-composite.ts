// Template placeholders (and String()) over composite values: arrays print
// Array.prototype.toString — join(",") over the same element kinds the
// .join() lowering supports, unit arms printing empty — and plain data
// records print Object.prototype.toString's constant "[object Object]".

// Arrays of each joinable element kind.
console.log(`abc${[1, 2, 3]}def`);
console.log(`${["a", "b"]}`);
console.log(`${[true, false]}`);
console.log(String([1.5, -0, 100]));
console.log(`empty:${[]}:end` === "empty::end" ? "empty-ok" : "empty-bad");

// Union elements with unit arms: undefined/null print EMPTY inside join,
// exactly Node.
const withUnits: (string | undefined | null)[] = ["a", undefined, null, "b"];
console.log(`${withUnits}`);

// Records: the constant, with surrounding text intact — and evaluation of
// the operand still happens (the field initializer's call runs once).
console.log(`abc${{ x: 10, y: 20 }}def`);
let evals = 0;
function tick(): number {
  evals++;
  return 7;
}
console.log(`${{ n: tick() }}`);
console.log(evals);
console.log(String({ deep: { nested: "yes" } }));

// A stored record read through a binding.
const rec = { a: 1, b: "two" };
console.log(`rec=${rec}`);
