// Seeded Set construction: `new Set(values)` from an array literal and
// from an array-typed variable — duplicates collapse keeping the FIRST
// insertion position, iteration order is insertion order, and the seed
// array itself is untouched (and still usable) afterwards.
const fruits = new Set(["cherry", "apple", "cherry", "banana", "apple"]);
console.log(fruits.size);
fruits.forEach((f) => {
  console.log(f);
});

// From a variable: the array is BORROWED — mutating it later never
// touches the set, and the set never touches the array.
const nums: number[] = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];
const digits = new Set(nums);
console.log(digits.size, digits.has(9), digits.has(7));
nums.push(7);
console.log(digits.has(7), nums.length);

// Empty seed: an empty set.
const none = new Set<string>([]);
console.log(none.size);

// Number elements keep SameValueZero through seeding: NaN collapses with
// NaN, -0 with +0.
const nan = 0 / 0;
const weird = new Set([nan, 0 / 0, -0, 0, nan]);
console.log(weird.size, weird.has(nan), weird.has(0));

// A seeded set is an ordinary set afterwards: add/delete/clear work.
fruits.add("date");
console.log(fruits.size, fruits.delete("cherry"), fruits.size);

// The explicit type-argument form seeds too.
const typed = new Set<number>([10, 20, 10]);
console.log(typed.size);

// Seeding from an expression (not a plain identifier) works as well.
function firstWords(): string[] {
  return ["one", "two", "one"];
}
const words = new Set(firstWords());
console.log(words.size, words.has("two"));
