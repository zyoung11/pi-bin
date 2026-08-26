// Namespace fences (tsc-clean, outside the lowered slice): the namespace
// OBJECT as a first-class value, init-position reads above the declaring
// block, and bare references across merged blocks (Node's transform
// throws ReferenceError where tsc's emit would qualify). import= aliases
// of mutable members lower now (the snapshot `var x = N.y` Node emits —
// see the 1968 corpus programs), so they are no longer fenced here.

namespace N {
  export const x = 1;
  export let y = 2;
  export function f(): number {
    return N.x;
  }
}

// The namespace object has no first-class runtime value.
const grabbed = N;
console.log(grabbed.x);

// Init-position read above the declaring block: Node would observe an
// uninitialized binding.
console.log(Late.v);
namespace Late {
  export const v = 3;
}

// Bare cross-block reference: Node's transform does not bind exported
// members across namespace blocks.
namespace N {
  export function g(): number {
    return f() + 1;
  }
}
console.log(N.g());

console.log(N.f());
