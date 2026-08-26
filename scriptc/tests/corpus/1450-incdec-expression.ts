// Expression-position ++/-- : postfix yields the OLD value, prefix the NEW,
// and the binding updates in place — locals, captured (boxed) locals, and
// module globals, across the value positions a real CLI exercises (record
// fields, array indices, call arguments, assignment RHS).

// Plain local, postfix and prefix.
let a = 10;
console.log(a++);
console.log(a);
console.log(++a);
console.log(a);
console.log(a--);
console.log(--a);
console.log(a);

// RHS of assignments and declarations.
let b = 5;
const old = b++;
console.log(old, b);
let c = 0;
c = b++ + ++b;
console.log(c, b);

// Array index positions: arr[i++] reads THEN advances.
const arr = [100, 200, 300, 400];
let i = 0;
console.log(arr[i++]);
console.log(arr[i++]);
console.log(arr[--i]);
console.log(i);

// Call arguments evaluate left-to-right.
let n = 1;
console.log(n++, n++, ++n);
console.log(n);

// Record fields — the jobs.ts pattern: index stamped from a counter.
let jobIndex = 0;
function makeJob(label: string): { label: string; index: number } {
  return { label, index: jobIndex++ };
}
const jobs = [makeJob("a"), makeJob("b"), makeJob("c")];
for (const j of jobs) console.log(j.label, j.index);

// Captured local mutated through a closure (the boxed-binding path) —
// the p-map worker pattern: several closures sharing one counter.
function counterPair(): { next: () => number; peek: () => number } {
  let nextIdx = 0;
  return { next: () => nextIdx++, peek: () => nextIdx };
}
const pair = counterPair();
console.log(pair.next(), pair.next(), pair.next());
console.log(pair.peek());

// Module global receiver.
console.log(jobIndex++);
console.log(jobIndex);

// Statement position still works (the historic desugar).
let s = 7;
s++;
--s;
console.log(s);

// Conditions and loops in value position.
let k = 0;
while (k++ < 3) console.log("k", k);
console.log(k);
