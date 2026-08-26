// @transform-types
// Value namespaces are static shapes: exported consts/functions resolve at
// compile time to qualified bindings, namespace bodies run at module init
// in source order (declaration-time side effects included), and merged
// blocks contribute to one namespace. Qualified references only — Node's
// transform does not bind bare exported names across blocks, and scriptc
// fences those instead of diverging.
namespace Counter {
  export const start = 10;
  export let value = start;
  export function bump(): number {
    value = value + 1;
    return value;
  }
  console.log("Counter body ran, start =", start);
}

namespace Counter {
  export function bumpTwice(): number {
    Counter.bump();
    return Counter.bump();
  }
}

console.log(Counter.value);
console.log(Counter.bump());
console.log(Counter.bumpTwice());

// Qualified writes: plain, compound, increment — all module-global writes.
Counter.value = 100;
console.log(Counter.value);
Counter.value += 5;
console.log(Counter.value);
Counter.value++;
Counter.value--;
Counter.value++;
console.log(Counter.value);
console.log(Counter.bump());

// Sibling namespaces with colliding member names keep distinct storage,
// and a top-level binding under the same name is untouched.
namespace A {
  export const t = 1;
  export function tag(): string {
    return "A";
  }
}
namespace B {
  export const t = 2;
  export function tag(): string {
    return "B";
  }
}
const t = 3;
console.log(A.t, B.t, t, A.tag(), B.tag());

// Non-exported members are block-local; each block keeps its own.
namespace Blocks {
  const hidden = "first";
  export function readFirst(): string {
    return hidden;
  }
}
namespace Blocks {
  const hidden = "second";
  export function readSecond(): string {
    return hidden;
  }
}
console.log(Blocks.readFirst(), Blocks.readSecond());

// A namespace function used as a VALUE (passed, called indirectly).
namespace Fns {
  export function triple(n: number): number {
    return n * 3;
  }
}
const f: (n: number) => number = Fns.triple;
console.log(f(7));
console.log([1, 2, 3].map(Fns.triple).join(","));
