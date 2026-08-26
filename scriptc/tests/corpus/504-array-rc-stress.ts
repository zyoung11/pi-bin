// RC torture for arrays: arrays of strings built in loops, popped,
// reassigned, nested arrays traded between locals and functions, early
// returns from for-of. The sanitized lane (ASan + RC audit) proves none of
// this leaks or double-frees — including the recursive release of string
// elements when their array dies.
function makeRows(n: number): string[][] {
  const rows: string[][] = [];
  for (let i = 0; i < n; i++) {
    const row: string[] = [];
    for (let j = 0; j <= i; j++) {
      row.push(`r${i}c${j}`);
    }
    rows.push(row);
  }
  return rows;
}

function findCell(rows: string[][], needle: string): string {
  for (const row of rows) {
    for (const cell of row) {
      if (cell === needle) {
        return cell + " found";
      }
    }
  }
  return "missing";
}

const rows: string[][] = makeRows(4);
console.log(rows.length, rows[3].length);
console.log(findCell(rows, "r2c1"), findCell(rows, "r9c9"));

// reassignment releases the old array (and its strings) mid-loop
let acc: string[] = [];
for (let round = 0; round < 6; round++) {
  acc.push(`item-${round}`);
  if (round === 3) {
    acc = ["reset"];
  }
}
console.log(acc.length, acc[0], acc[1]);

// pop transfers string ownership out; drain fully
const stack: string[] = [];
for (let i = 0; i < 5; i++) {
  stack.push("v" + i);
}
let drained: string = "";
while (stack.length > 0) {
  drained += stack.pop();
}
console.log(drained);

// replacing elements releases the old ones
const slots: string[] = ["a", "b", "c"];
for (let i = 0; i < slots.length; i++) {
  slots[i] = slots[i] + slots[i];
}
console.log(slots[0], slots[1], slots[2]);

// nested arrays popped and dropped without ever being read
const junk: string[][] = [["x"], ["y", "z"]];
junk.pop();
console.log(junk.length);

// arrays living only inside a loop iteration (die every pass)
for (let k = 0; k < 3; k++) {
  const tmp: string[] = [`k=${k}`, "pad"];
  if (tmp.length === 2) {
    continue;
  }
  console.log("unreachable");
}
console.log("loop-local arrays done");

// conditionals over array references keep counts balanced
let cur: string[] = ["start"];
for (let n = 0; n < 4; n++) {
  cur = n % 2 === 0 ? [`even${n}`] : cur;
}
console.log(cur[0]);
