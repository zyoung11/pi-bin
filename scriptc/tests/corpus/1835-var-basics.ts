// `var` fundamentals: the binding is FUNCTION-scoped — declared anywhere in
// a function it exists across the whole body, same-name redeclarations merge
// into one slot, a `var` merging with a parameter overwrites the argument,
// and a function-expression binding can call itself through its own name.
var a = 1;
a = 2;
var a = 3; // same binding — a redeclaration merges, the initializer assigns
console.log(a);

// Block position is irrelevant: both branches write the ONE hoisted x.
function branchy(c: boolean): number {
  if (c) {
    var x = 10;
  } else {
    var x = 20;
  }
  return x;
}
console.log(branchy(true), branchy(false));

// Multi-declarator var statements assign in order; later initializers see
// earlier bindings.
function multi(): string {
  var p = "p", q = p + "q", r = q + "r";
  return r;
}
console.log(multi());

// A `var` redeclaring a parameter IS the parameter (one merged binding).
function param(v: number): number {
  var v = v + 1;
  return v;
}
console.log(param(5));

// Self-referencing function expression bound by var: the binding exists
// (hoisted) when the closure body resolves its own name.
var fact = function (n: number): number {
  return n <= 1 ? 1 : n * fact(n - 1);
};
console.log(fact(5));

// Switch case bodies share the function scope: both arms declare the same s.
function sw(k: number): string {
  switch (k) {
    case 1:
      var s = "one";
      break;
    default:
      var s = "other";
  }
  return s;
}
console.log(sw(1), sw(9));

// try/catch: vars hoist out of both blocks.
function tc(): string {
  try {
    var t: string | undefined = "tried";
    throw new Error("boom");
  } catch {
    var u = "caught";
  }
  return (t ?? "?") + "/" + u;
}
console.log(tc());

// Destructuring var declarations assign the hoisted slots.
var [d1, d2] = [10, 20];
console.log(d1 + d2);
var { m: dm, n: dn } = { m: "x", n: "y" };
console.log(dm + dn);

function blockPattern(): string {
  {
    var [q1, q2] = ["in", "block"];
  }
  return q1 + "-" + q2;
}
console.log(blockPattern());
