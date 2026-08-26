// The classic `var` capture semantics: a `var` in a loop is ONE binding per
// function — closures created inside the loop all share it and read its
// FINAL value — where `let` mints a fresh binding per iteration. Both are
// modeled; this program pins them side by side, differentially against Node.
function varLoop(): string {
  var fns: (() => number)[] = [];
  for (var i = 0; i < 3; i++) {
    fns.push(() => i);
  }
  return fns.map((f) => String(f())).join(",");
}
console.log(varLoop()); // 3,3,3 — one shared binding

function letLoop(): string {
  const fns: (() => number)[] = [];
  for (let i = 0; i < 3; i++) {
    fns.push(() => i);
  }
  return fns.map((f) => String(f())).join(",");
}
console.log(letLoop()); // 0,1,2 — fresh binding per iteration

// Multi-declarator var for-init: the everyday `for (var i = 0, n = ...)`.
function multiInit(xs: number[]): string {
  var out = "";
  for (var j = 0, n = xs.length; j < n; j++) {
    out += String(xs[j]);
  }
  return out + "|" + String(j) + "/" + String(n); // j and n persist after the loop
}
console.log(multiInit([7, 8, 9]));

// while-loop capture: same shared-slot story without a for head.
function whileLoop(): string {
  var out: (() => number)[] = [];
  var k = 0;
  while (k < 3) {
    var snap = k; // ONE binding — every closure sees the last write
    out.push(() => snap);
    k++;
  }
  return out.map((f) => String(f())).join(",");
}
console.log(whileLoop()); // 2,2,2

// for-of with var: one binding assigned per pass; closures share it and the
// value persists after the loop.
function forOfVar(): string {
  var getters: (() => string)[] = [];
  for (var w of ["a", "b", "c"]) {
    getters.push(() => w);
  }
  return getters.map((g) => g()).join(",");
}
console.log(forOfVar()); // c,c,c

// for-of var over a string, a Set, and a Map (each has its own desugar).
function containers(): string {
  var acc = "";
  for (var ch of "héllo") acc += ch + ".";
  for (var e of new Set(["p", "q"])) acc += e;
  for (var [mk, mv] of new Map([["k", 1]])) acc += "/" + mk + String(mv);
  return acc;
}
console.log(containers());

// A var whose declaration sits INSIDE the loop persists across iterations —
// the declaration statement is not a reset.
function persists(): string {
  var acc = "";
  for (let k = 0; k < 3; k++) {
    var last: string | undefined;
    if (k === 1) last = "one";
    acc += (last === undefined ? "undefined" : last) + ";";
  }
  return acc;
}
console.log(persists()); // undefined;one;one;
