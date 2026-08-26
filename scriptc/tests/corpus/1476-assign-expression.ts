// Assignment as an expression: `x = e` in value position evaluates e once,
// writes the binding, and yields the assigned value — JS evaluation order.
// The while-condition idiom is the load-bearing case (`while ((idx =
// s.indexOf(sep)) !== -1)`); plain value positions, ref-counted values,
// module globals, and captured (boxed) bindings are exercised too.

// The while-condition scanning idiom, exactly the prefixStream shape.
function splitLines(buffer: string): string[] {
  const out: string[] = [];
  let idx: number;
  while ((idx = buffer.indexOf("\n")) !== -1) {
    out.push(buffer.slice(0, idx));
    buffer = buffer.slice(idx + 1);
  }
  if (buffer) out.push(buffer);
  return out;
}
console.log(JSON.stringify(splitLines("alpha\nbeta\ngamma")));
console.log(JSON.stringify(splitLines("no newline")));
console.log(JSON.stringify(splitLines("")));
console.log(JSON.stringify(splitLines("trailing\n")));

// Plain value positions: the yielded value IS the assigned value.
let a = 0;
let b = 0;
b = (a = 41) + 1;
console.log(a, b);

// Chained assignment: right-associative, both bindings observe the value.
let x = 0;
let y = 0;
x = y = 7;
console.log(x, y);

// In a call argument (evaluation order: the argument assignment runs first).
function twice(n: number): number {
  return n * 2;
}
let arg = 1;
console.log(twice(arg = 10), arg);

// Ref-counted values: strings through the same path.
let s = "start";
let t = "";
t = (s = "mid") + "!";
console.log(s, t);
// The old value of the binding is released, the new one survives the temp.
let r = "old-".repeat(2);
console.log((r = r + "new"), r);

// Condition position with a string: truthiness of the assigned value.
let line = "seed";
let count = 0;
const parts = ["one", "two", ""];
let i = 0;
while ((line = parts[i]) !== "") {
  count++;
  i++;
}
console.log(count, line);

// Module-global target (assigned from inside a function).
let total = 0;
function bump(n: number): number {
  return (total = total + n);
}
console.log(bump(5), bump(7), total);

// Captured (boxed) binding: the closure and the assignment share the box.
function makeCounter(): { next: () => number; peek: () => number } {
  let n = 0;
  return {
    next: () => (n = n + 1),
    peek: () => n,
  };
}
const c = makeCounter();
console.log(c.next(), c.next(), c.peek());

// Boxed string binding through assignExpr.
function makeTag(): { set: (v: string) => string; get: () => string } {
  let tag = "none";
  return {
    set: (v: string) => (tag = v),
    get: () => tag,
  };
}
const tag = makeTag();
console.log(tag.set("hot"), tag.get());

// NaN / falsy-number edge in condition position: 0 is falsy but !== -1.
const nums = [3, 0, 5, -1];
let j = 0;
let cur = 0;
const seen: number[] = [];
while ((cur = nums[j]) !== -1) {
  seen.push(cur);
  j++;
}
console.log(JSON.stringify(seen));
