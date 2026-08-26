// Class static blocks are DECLARATION-TIME code: Node runs each block once
// when the class statement evaluates, whether or not anything ever
// references the class. Pins the classStaticBlock28 miscompile (an
// UNREFERENCED class's block silently dropped — the deferred-collection
// hole) and the block's write-through to module bindings.
let foo: number;
let log: string[] = [];

class Unreferenced {
  static {
    foo = 1;
    log.push("unreferenced block ran");
  }
}

console.log(foo);
console.log(log.join(","));

// A referenced class's block runs exactly once, at the class statement —
// before any construction, not per-instance.
let blockRuns = 0;
class Counted {
  n = 100;
  static {
    blockRuns++;
  }
}
console.log("before construction:", blockRuns);
const a = new Counted();
const b = new Counted();
console.log("after construction:", blockRuns, a.n + b.n);
