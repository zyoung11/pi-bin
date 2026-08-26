// do-while: the body runs before the condition is ever tested.
let n = 10;
do {
  console.log("runs once even though the condition starts false", n);
  n = n + 1;
} while (n < 5);
console.log("after", n);

// condition side effects run AFTER each iteration, including the last
function belowLimit(x: number): boolean {
  console.log("checking", x);
  return x < 3;
}
let i = 0;
do {
  console.log("body", i);
  i = i + 1;
} while (belowLimit(i));

// continue jumps to the CONDITION (the update above it still ran)
let c = 0;
do {
  c = c + 1;
  if (c === 2) {
    continue;
  }
  console.log("c", c);
} while (c < 4);

// break exits immediately, condition not evaluated again
let b = 0;
do {
  if (b === 2) {
    break;
  }
  console.log("b", b);
  b = b + 1;
} while (belowLimit(b));
console.log("broke at", b);

// nested do-while
let row = 0;
do {
  let out = `row ${row}:`;
  let col = 0;
  do {
    out = out + ` ${col}`;
    col = col + 1;
  } while (col < row);
  console.log(out);
  row = row + 1;
} while (row < 4);

// truthiness conditions: numbers (0/NaN falsy) and strings ("" falsy)
let countdown = 3;
do {
  console.log("countdown", countdown);
  countdown = countdown - 1;
} while (countdown);

let tail: string = "abc";
do {
  console.log("tail", tail);
  tail = tail.slice(1);
} while (tail);

// strings allocated per iteration with break/continue jump paths (RC)
let hits = 0;
let j = 0;
do {
  j = j + 1;
  const label = `pass ${j}`;
  if (j % 2 === 0) {
    continue;
  }
  if (j > 5) {
    break;
  }
  console.log(label);
  hits = hits + 1;
} while (true);
console.log("hits", hits);

// do-while as a function's only exit path
function firstPower(of: number, above: number): number {
  let p = of;
  do {
    p = p * of;
  } while (p <= above);
  return p;
}
console.log(firstPower(2, 100), firstPower(3, 10));
console.log("done");
