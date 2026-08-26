// find / some / every with JS-exact semantics: the length is read once up
// front, callbacks run left-to-right, and all three short-circuit — no
// callback runs past the deciding element. find's miss is undefined,
// narrowed through the T | undefined union like a Map get-miss.
const nums = [3, 8, 15, 4, 42];

const firstBig = nums.find((x) => x > 10);
if (firstBig !== undefined) console.log("firstBig", firstBig, firstBig + 1);
const missing = nums.find((x) => x > 100);
console.log(missing === undefined, missing !== undefined);

// Short-circuit: the callback stops at the first hit.
let findCalls = 0;
nums.find((x) => {
  findCalls += 1;
  return x === 15;
});
console.log("findCalls", findCalls);

// some / every over numbers, strings, booleans.
console.log(nums.some((x) => x > 40), nums.some((x) => x > 100));
console.log(nums.every((x) => x > 0), nums.every((x) => x % 2 === 0));
console.log(["a", "bc", ""].some((s) => s.length === 0));
console.log(["a", "bc"].every((s) => s.length > 0));
console.log([true, true].every((b) => b), [false, false].some((b) => b));

// Short-circuit counts for both.
let someCalls = 0;
nums.some((x) => {
  someCalls += 1;
  return x === 8;
});
let everyCalls = 0;
nums.every((x) => {
  everyCalls += 1;
  return x < 10;
});
console.log("calls", someCalls, everyCalls);

// Empty arrays: some is false, every is (vacuously) true, find misses.
const empty: number[] = [];
console.log(empty.some((x) => x > 0), empty.every((x) => x > 0));
console.log(empty.find((x) => x > 0) === undefined);

// Index and array parameters: JS passes (element, index, array).
const bytes = [80, 75, 3, 4];
const prefix = [80, 75];
console.log(prefix.every((byte, index) => bytes[index] === byte));
console.log(prefix.some((byte, index) => bytes[index] !== byte));
console.log(nums.some((x, i, arr) => i === arr.length - 1 && x === 42));
const atIndex = nums.find((_x, i) => i === 3);
if (atIndex !== undefined) console.log("atIndex", atIndex);

// find over record elements: the hit aliases the stored record (mutating
// the found record mutates the array's element, like JS), the miss is the
// undefined arm of a REF union.
const people = [
  { id: "a", age: 30 },
  { id: "b", age: 40 },
];
const b = people.find((p) => p.id === "b");
if (b !== undefined) {
  console.log("found", b.id, b.age);
  b.age = 41;
}
console.log(people[1]!.age);
const nobody = people.find((p) => p.id === "z");
console.log(nobody === undefined);

// some/every on record and string-array elements.
console.log(people.some((p) => p.age > 35), people.every((p) => p.age > 35));
const models = ["gpt-x", "claude-y"];
console.log(models.every((m) => !m.startsWith("gemini")));
console.log(models.some((m) => m === "claude-y"));

// find over string elements, and unions with an undefined arm already in
// the element type (result union == element union).
const words = ["alpha", "beta", "gamma"];
const g = words.find((w) => w.startsWith("g"));
if (g !== undefined) console.log(g, g.length);
const maybe: (string | undefined)[] = ["x", undefined, "y"];
const present = maybe.find((w) => w !== undefined);
if (present !== undefined) console.log("present", present);
