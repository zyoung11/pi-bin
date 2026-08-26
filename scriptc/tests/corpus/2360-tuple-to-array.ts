// A TUPLE flowing into an array slot — the `as const` table pattern
// (`const NAMES = [...] as const` annotated `readonly Name[]`, the service
// registry shape): TS erases the arity for free; the monomorphic tuple
// REBUILDS as a fresh array through the interned %tup.arr helper, each
// position lifted into the element type (the width family's copy stance —
// SEMANTICS.md; readonly sources make the non-aliasing unobservable).
// Every read below must byte-match Node.

const NAME_LIST = ["vercel", "github", "google", "slack"] as const;
type Name = (typeof NAME_LIST)[number];
const NAMES: readonly Name[] = NAME_LIST;

console.log(NAMES.length);
console.log(NAMES.join(","));
for (const n of NAMES) console.log(n.toUpperCase());

// The declared-tuple spelling (no `as const`) into a plain mutable array.
// The rebuild is a fresh array — mutations through the array value do NOT
// reach the tuple (divergence 35's copy stance, extended to tuples; this
// fixture only observes the array side, where Node agrees byte-for-byte).
const pair: [number, number] = [3, 4];
const nums: number[] = pair;
nums.push(5);
console.log(nums.length);
console.log(nums[0]! + nums[1]! + nums[2]!);

// Positions LIFT, not just copy: literal-typed positions into a wider
// union-element array (each element wraps into its arm).
const flags = [true, "auto"] as const;
const mixed: readonly (boolean | string)[] = flags;
for (const f of mixed) {
  if (typeof f === "boolean") console.log("boolean", f);
  else console.log("string", f);
}

// A tuple answering a readonly-array-typed RETURN slot — the coercion
// applies at every flow edge, not just initializers.
function defaults(): readonly string[] {
  const d = ["a", "b"] as const;
  return d;
}
console.log(defaults().join("+"));

// And through a CALL argument into a readonly-array parameter.
function count(xs: readonly number[]): number {
  let sum = 0;
  for (const x of xs) sum += x;
  return sum;
}
const triple: [number, number, number] = [10, 20, 30];
console.log(count(triple));
