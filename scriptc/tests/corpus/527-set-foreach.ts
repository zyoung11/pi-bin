// Set.forEach: insertion order, the (value, value) callback shape, and
// JS's live-iteration contract — deletes are skipped, adds are visited,
// clear stops everything, all while forEach is running.
const s = new Set<string>();
s.add("a");
s.add("b");
s.add("c");

// insertion order, one parameter
s.forEach((v) => {
  console.log("visit", v);
});

// JS passes the element as BOTH value and key
s.forEach((v, k) => {
  console.log(v === k, v);
});

// zero-parameter callbacks are ordinary TS
let count = 0;
s.forEach(() => {
  count = count + 1;
});
console.log("count", count);

// re-adding an existing element does NOT move it
const order = new Set<number>();
order.add(1);
order.add(2);
order.add(3);
order.add(1);
order.forEach((v) => console.log("order", v));

// deleting a not-yet-visited element skips it
const del = new Set<string>();
del.add("x");
del.add("y");
del.add("z");
del.forEach((v) => {
  if (v === "x") del.delete("y");
  console.log("del", v);
});
console.log("after delete", del.size);

// adding during iteration: appended elements ARE visited
const grow = new Set<number>();
grow.add(1);
grow.add(2);
grow.forEach((v) => {
  if (v < 3) grow.add(v + 10);
  console.log("grow", v);
});
console.log("after grow", grow.size);

// clear during iteration stops the loop (nothing live remains)...
const wipe = new Set<string>();
wipe.add("p");
wipe.add("q");
wipe.add("r");
wipe.forEach((v) => {
  console.log("wipe", v);
  if (v === "p") wipe.clear();
});
console.log("after wipe", wipe.size);

// ...but elements added AFTER the clear are visited (Node-exact)
const phoenix = new Set<string>();
phoenix.add("one");
phoenix.add("two");
phoenix.forEach((v) => {
  if (v === "one") {
    phoenix.clear();
    phoenix.add("reborn");
  }
  console.log("phoenix", v);
});
console.log("after phoenix", phoenix.size, phoenix.has("reborn"));

// deletes and re-adds churn storage safely under an active iteration
const churn = new Set<number>();
churn.add(0);
let visits = 0;
churn.forEach((v) => {
  visits = visits + 1;
  if (v < 20) {
    churn.delete(v);
    churn.add(v + 1);
  }
});
console.log("churn", visits, churn.size, churn.has(20));

// number-set forEach
const nums = new Set<number>();
nums.add(0 / 0);
nums.add(-0);
nums.add(7);
nums.forEach((v) => console.log("num", v));
