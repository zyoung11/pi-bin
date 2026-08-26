// join with JS-exact stringification (shortest-roundtrip numbers,
// true/false booleans, strings verbatim), plus chained map/filter/join.
console.log([1, 2, 3].join(","));
console.log([1.5, -0, 0.1, 1e21, 1e-7].join("|")); // JS number formatting, -0 prints "0"
console.log([0 / 0, 1 / 0, -1 / 0].join(" ")); // NaN Infinity -Infinity
console.log(["a", "", "c"].join("-")); // empty elements keep their slots
console.log([true, false, true].join("&"));
console.log(["solo"].join(","), [42].join(","));
const empty: string[] = [];
console.log(`<${empty.join(",")}>`);
console.log(["x", "y"].join("")); // empty separator
console.log(["p", "q"].join(" :: ")); // multi-char separator

// Chained: map -> filter -> join in one expression.
const nums = [1, 2, 3, 4, 5, 6];
console.log(
  nums
    .map((x) => x * x)
    .filter((x) => x % 2 === 0)
    .join(","),
);
console.log(nums.map((x) => `<${x}>`).join("").length);

// join result is a plain string: methods and concatenation apply.
const joined = [10, 20].join("+");
console.log(joined + "=30", joined.indexOf("+"));
