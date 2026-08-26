const x: number = 10;
if (x > 5) {
  console.log("big");
} else {
  console.log("small");
}
if (x === 10) console.log("exactly ten");
if (x < 0) {
  console.log("negative");
} else if (x === 0) {
  console.log("zero");
} else {
  console.log("positive");
}
const s: string = "b";
if (s === "a" || s === "b") {
  console.log("a or b");
}
if (x > 0 && !(s === "a")) {
  console.log("both");
}
