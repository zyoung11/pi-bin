// `let x;` without an initializer: declared, assigned later. tsc's
// definite-assignment analysis guarantees no read before assignment, so
// every read below is provably after a write.
let x: number;
const cond: boolean = true;
if (cond) {
  x = 1;
} else {
  x = 2;
}
console.log(x);

// refcounted locals: first assignment writes into a NULL slot
let s: string;
if (x === 1) {
  s = "one";
} else {
  s = "other";
}
console.log(s);
s = s + "!";
console.log(s);

let arr: number[];
arr = [];
arr.push(x);
arr.push(x + 1);
console.log(arr.length, arr[0], arr[1]);

// declared but assigned only on some paths (never read on the others):
// the unassigned path releases a still-NULL local at scope exit
function maybeLabel(n: number): number {
  let label: string;
  if (n > 10) {
    label = `big ${n}`;
    console.log(label);
    return 1;
  }
  return 0;
}
console.log(maybeLabel(50), maybeLabel(3));

// declared in a loop body, conditionally assigned each iteration
for (let i = 0; i < 4; i = i + 1) {
  let t: string;
  if (i % 2 === 0) {
    t = `even ${i}`;
    console.log(t);
  }
}

// assigned inside a loop, reassignment releasing the previous value
let last: string;
last = "start";
for (let i = 0; i < 3; i = i + 1) {
  last = `pass ${i}`;
}
console.log(last);

// multi-declaration mixing initialized and uninitialized declarators
let ready = false, message: string;
message = ready ? "yes" : "no";
console.log(message);

// captured by a closure before the first assignment (assigned before call)
let shared: string;
const read = (): string => `shared=${shared}`;
shared = "set";
console.log(read());
shared = "reset";
console.log(read());

// uninitialized in a switch case, assigned across fall-through
const route: number = 1;
switch (route) {
  case 1:
    let scratch: string;
    scratch = "assigned in case 1";
    console.log(scratch);
    break;
  default:
    console.log("no");
}
console.log("done");
