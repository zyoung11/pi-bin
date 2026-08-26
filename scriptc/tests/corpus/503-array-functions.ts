// Arrays crossing function boundaries (params own, returns transfer) and
// reference semantics: assignment aliases, === / !== is identity.
function sum(xs: number[]): number {
  let total: number = 0;
  for (const x of xs) {
    total += x;
  }
  return total;
}

function range(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push(i);
  }
  return out;
}

function appendTo(xs: number[], v: number): number {
  return xs.push(v);
}

console.log(sum([1, 2, 3]), sum(range(5)), sum([]));

// callee mutation is visible through the caller's reference
const shared: number[] = [10];
console.log(appendTo(shared, 20), shared.length, shared[1]);

// aliasing: b IS a
const a: number[] = [1];
const b: number[] = a;
b.push(2);
console.log(a.length, a[1]);
a[0] = 100;
console.log(b[0]);

// identity: same reference, not same contents
const c: number[] = [1, 2];
const d: number[] = [1, 2];
console.log(a === b, a !== b, c === d, c !== d);
console.log(shared === shared);

// arrays of strings through calls
function shout(words: string[]): string[] {
  const out: string[] = [];
  for (const w of words) {
    out.push(w + "!");
  }
  return out;
}
const shouted: string[] = shout(["hi", "yo"]);
console.log(shouted[0], shouted[1], shouted.length);

// nested arrays as parameters; inner references alias too
function firstRowOf(m: number[][]): number[] {
  return m[0];
}
const matrix: number[][] = [[1, 2], [3]];
const row: number[] = firstRowOf(matrix);
console.log(row === matrix[0], row !== matrix[1]);
row.push(99);
console.log(matrix[0].length, matrix[0][2]);

// ternary picks one reference (never evaluates the other arm)
function pick(flag: boolean, x: number[], y: number[]): number[] {
  return flag ? x : y;
}
const chosen: number[] = pick(true, c, d);
console.log(chosen === c, chosen === d);
