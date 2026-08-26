// Multi-declaration statements: declarators run left to right, later ones
// see earlier bindings (JS-exact).
let a = 1, b = a + 1, c = a + b;
console.log(a, b, c);
a = 100;
console.log(a, b, c);

// const chains, mixed types in one statement
const first: string = "one", second = `${first}-two`, count = 2;
console.log(first, second, count);

// RC types: strings and arrays declared together, referencing earlier ones
let head = "H", tail = head + "T", both = `${head}|${tail}`;
console.log(head, tail, both);
both = "reassigned";
console.log(both);

const xs: number[] = [1, 2], ys: number[] = [xs[0] * 10, xs[1] * 10], n = xs.length + ys.length;
console.log(xs[0], ys[0], ys[1], n);

// initializers with side effects evaluate in declaration order
function make(label: string, v: number): number {
  console.log("init", label);
  return v;
}
let p = make("p", 1), q = make("q", p + 1), r = make("r", q * 2);
console.log(p, q, r);

// inside functions and blocks
function span(lo: number, hi: number): number {
  let width = hi - lo, mid = lo + width / 2;
  return mid;
}
console.log(span(0, 10));
if (a > 1) {
  let inner1 = "in", inner2 = inner1 + "ner";
  console.log(inner2);
}

// inside loop bodies: fresh values each iteration
for (let i = 0; i < 3; i = i + 1) {
  const doubled = i * 2, label = `i=${i} doubled=${doubled}`;
  console.log(label);
}

// multi-decl where an earlier declarator is captured by a later initializer
let base = 5, add = (x: number): number => x + base, applied = add(10);
console.log(applied);
base = 6;
console.log(add(10));
console.log("done");
