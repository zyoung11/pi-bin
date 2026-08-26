// @transform-types
// Type-only namespaces are pure type world: only interfaces and type
// aliases inside — zero runtime, nothing prints from them, and the types
// serve annotations exactly like top-level declarations. Ambient value
// declarations inside real namespaces stay type-world too.
namespace Types {
  export interface Point {
    x: number;
    y: number;
  }
  export type Pair = [number, number];
  export namespace Deep {
    export interface Named {
      name: string;
    }
  }
}

const p: Types.Point = { x: 1, y: 2 };
const q: Types.Deep.Named = { name: "n" };
console.log(p.x + p.y, q.name);

function shift(pt: Types.Point, by: number): Types.Point {
  return { x: pt.x + by, y: pt.y + by };
}
console.log(shift(p, 10).x);

// Merging a VALUE namespace with additional TYPE-only blocks: the type
// block adds no runtime, the value block runs normally.
namespace Mixed {
  export const v = 5;
}
namespace Mixed {
  export interface Extra {
    e: number;
  }
}
const m: Mixed.Extra = { e: Mixed.v };
console.log(m.e);
