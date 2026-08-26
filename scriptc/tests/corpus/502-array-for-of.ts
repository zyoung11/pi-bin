// for-of over arrays: iteration order, break/continue, nesting, fresh
// binding per iteration, and the JS rule that the length is re-read every
// iteration (appending inside the body extends the walk).
const nums: number[] = [1, 2, 3, 4, 5];
let sum: number = 0;
for (const n of nums) {
  sum += n;
}
console.log(sum);

// break/continue inside for-of (with a string local in scope, so the
// sanitized lane proves the jump paths release correctly)
for (const n of nums) {
  const tag: string = `n=${n}`;
  if (n % 2 === 0) {
    continue;
  }
  if (n > 4) {
    break;
  }
  console.log(tag);
}

// nested for-of; inner break binds to the inner loop
const grid: number[][] = [[1, 2], [3, 4, 5], [6]];
for (const row of grid) {
  let line: string = "row:";
  for (const cell of row) {
    if (cell === 4) {
      break;
    }
    line += ` ${cell}`;
  }
  console.log(line, row.length);
}

// for-of over strings-in-arrays; loop variable is a fresh const each pass
const words: string[] = ["one", "two", "three"];
for (const w of words) {
  console.log(w.length, w.slice(0, 2));
}

// the iterable expression is evaluated once (a call, not a variable)
function firstRow(): number[] {
  console.log("firstRow called");
  return [7, 8];
}
for (const v of firstRow()) {
  console.log(v);
}

// growth during iteration is visible (length re-read), JS-exact
const grow: number[] = [0];
for (const g of grow) {
  if (g < 3) {
    grow.push(g + 1);
  }
  console.log("saw", g);
}
console.log(grow.length);

// empty array: body never runs
const none: string[] = [];
for (const nothing of none) {
  console.log("unreachable", nothing);
}
console.log("done");
