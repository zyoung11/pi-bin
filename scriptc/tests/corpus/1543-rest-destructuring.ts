// `[current, ...rest]` over an ARRAY source: the rest name binds a fresh
// tail copy (arr.slice(i)) — the recursive segment-walk pattern. An empty
// tail is []; the source is untouched.
function expand(segments: string[]): string {
  const [current, ...rest] = segments;
  if (rest.length === 0) return current;
  return current + "/" + expand(rest);
}
console.log(expand(["packages", "*", "src"]));
console.log(expand(["solo"]));

const nums = [1, 2, 3, 4];
const [head, ...tail] = nums;
console.log(head, tail.length, tail.join("-"));
console.log(nums.length, nums.join(","));
tail.push(99);
console.log(nums.join(","), tail.join(","));

const one: string[] = ["only"];
const [only, ...none] = one;
console.log(only, none.length);

let mid = 0;
const letters: string[] = ["a", "b", "c", "d", "e"];
const [first, second, ...more] = letters;
mid += more.length;
console.log(first, second, mid, more.join(""));
