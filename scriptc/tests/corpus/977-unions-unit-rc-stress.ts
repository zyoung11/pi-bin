// RC stress over unit-armed unions: heavy wrap/narrow churn across both
// arms. Interned unit instances are immortal — releasing them thousands of
// times must be a no-op (the SAN lane's RC audit and ASan verify).

function maybeTag(i: number): string | undefined {
  if (i % 3 === 0) {
    return undefined;
  }
  return "item-" + i;
}

let hits = 0;
let chars = 0;
for (let i = 0; i < 2000; i++) {
  const v = maybeTag(i);
  if (v !== undefined) {
    hits = hits + 1;
    chars = chars + v.length;
  }
}
console.log(hits, chars);

// Reassignment churn on one binding: every write releases the old box.
let cur: number | null = null;
let sum = 0;
for (let i = 0; i < 1000; i++) {
  if (i % 2 === 0) {
    cur = i;
  } else {
    cur = null;
  }
  if (cur !== null) {
    sum = sum + cur;
  }
}
console.log(sum);

// Unit-armed unions inside records and passed through functions.
type Link = { label: string; next: string | undefined };
function hop(n: Link): string | undefined {
  return n.next;
}
let misses = 0;
for (let i = 0; i < 500; i++) {
  const n: Link = { label: "n" + i, next: i % 5 === 0 ? undefined : "n" + (i + 1) };
  const nx = hop(n);
  if (nx === undefined) {
    misses = misses + 1;
  }
}
console.log(misses);
