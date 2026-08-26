// Expando function members: `foo.bar = 12` on a module-level function
// declaration (or callable const) binds a member on the function's own
// symbol — each written member lowers as a module global routed by
// symbol identity, so reads, writes, compound assigns, and calls through
// the member all see one storage.

function foo(): string {
  return "foo()";
}
foo.bar = 12;
foo.count = 0;
console.log(foo.bar, foo());

// Reserved-word member names are plain data.
foo.default = "d";
foo.class = "c";
console.log(foo.default, foo.class);

// Compound assigns and inc/dec are global-variable forms.
foo.count += 5;
foo.count++;
console.log(foo.count);

// Assignment in EXPRESSION position yields the assigned value.
const seen = (foo.bar = 34) + 1;
console.log(seen, foo.bar);
let d: number;
d = foo.bar = 55;
console.log(d, foo.bar);

// Function-valued members call through the member.
function example(): void {}
example.describe = function (tag: string): string {
  return "described:" + tag;
};
console.log(example.describe("x"));

// Arrow-const receivers work the same.
const arrowFn = () => "arrow()";
arrowFn.meta = "m1";
console.log(arrowFn.meta, arrowFn());

// Interface-typed callable consts: the declared member routes to the
// same per-symbol storage.
interface Combo {
  (): number;
  p?: { [s: string]: number };
}
const combo: Combo = () => 41;
combo.p = { a: 1 };
console.log(combo(), JSON.stringify(combo.p));

// Unique-symbol keys and folded element keys are the dotted forms' twins.
const priv = Symbol();
function keyed(): void {}
keyed[priv] = "via-symbol";
const strMem = "strMemName";
keyed[strMem] = "via-folded";
const numMem = 42;
keyed[numMem] = "via-number";
console.log(keyed[priv], keyed[strMem], keyed[numMem]);

// Members read from inside function bodies observe the live global.
function reader(): number {
  return foo.count;
}
foo.count = 100;
console.log(reader());
