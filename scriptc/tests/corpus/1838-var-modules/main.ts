// Module-scope `var`: hoisted across the WHOLE module body (blocks
// included), readable as undefined by functions called above the
// declaration statement, shared by top-level loop closures, and live-bound
// across module boundaries when exported.
import { counter, bump } from "./dep.ts";

function show(v: string | number | undefined): string {
  return v === undefined ? "undefined" : String(v);
}

// A function called BEFORE the module var's statement runs reads undefined.
function early(): string {
  return show(mv);
}
console.log(early());
var mv: number | undefined = 42;
console.log(early());

// A var inside a top-level block is module-scoped.
{
  var blockVar = "in-block";
}
console.log(blockVar);

// Top-level `for (var ...)`: closures share the module-scoped binding.
var fns: (() => number)[] = [];
for (var ti = 0; ti < 3; ti++) {
  fns.push(() => ti);
}
console.log(fns.map((f) => String(f())).join(","));

// Live-bound exported var.
console.log(counter);
bump();
bump();
console.log(counter);

// Top-level redeclaration merges into one global.
var td = 1;
var td = 2;
console.log(td);
