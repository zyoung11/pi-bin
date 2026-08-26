// Function-element arrays: the REF element kind carries closures — JS
// function identity through indexOf/includes/===, elements callable, the
// whole mutating surface, and capture cycles collected by the tracer.
function inc(n: number): number { return n + 1; }
function dec(n: number): number { return n - 1; }

const ops: ((n: number) => number)[] = [inc, dec, inc];
console.log(ops.length);
console.log(ops[0]!(5), ops[1]!(5), ops[2]!(5));
console.log(ops.indexOf(dec), ops.indexOf(inc));
console.log(ops.includes(dec), ops.includes((n: number) => n));

let total = 0;
for (const f of ops) total = f(total);
console.log(total);

ops.push(dec);
console.log(ops.length, ops[3] === dec, ops[3] === inc);
const popped = ops.pop()!;
console.log(popped === dec);
const sliced = ops.slice(1);
console.log(sliced.length, sliced[0] === dec);

// Inner closures: one allocation per evaluation, identity by reference.
const maker = (k: number) => (n: number) => n * k;
const closures: ((n: number) => number)[] = [];
for (let i = 1; i <= 3; i++) closures.push(maker(i));
console.log(closures[0]!(10), closures[1]!(10), closures[2]!(10));
console.log(closures[1] === closures[1], closures[1] === closures[2]);
console.log(closures.indexOf(closures[2]!));

const empty: (() => void)[] = [];
console.log(empty.length, empty.indexOf(() => {}));

// A closure capturing the array that holds it: a real cycle through the
// REF slots — the collector reclaims it (the sanitize lane audits this).
let hits = 0;
function makeCycle(): void {
  const arr: (() => void)[] = [];
  arr.push(() => { hits += arr.length; });
  arr[0]!();
}
for (let i = 0; i < 50; i++) makeCycle();
console.log(hits);
