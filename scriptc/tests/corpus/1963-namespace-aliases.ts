// @transform-types
// import= entity aliases: namespace targets, const-member targets, class
// targets, `export import` re-exports, and function+namespace merging.
// All pure plumbing — references resolve through the alias to the same
// registrations, guarded by the source-order fences for what Node's
// emitted `var x = ...` could not honor.
namespace Vec {
  export const dims = 2;
  export function len2(x: number, y: number): number {
    return x * x + y * y;
  }
  export class V {
    x: number;
    y: number;
    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
    }
    sum(): number {
      return this.x + this.y;
    }
  }
  export namespace Deep {
    export const tag = "deep-tag";
  }
}

import v = Vec;
console.log(v.dims, v.len2(3, 4));
const inst = new v.V(5, 6);
console.log(inst.sum());
console.log(v.Deep.tag);

import mkV = Vec.V;
const inst2 = new mkV(7, 8);
console.log(inst2.sum());

import d = Vec.dims;
console.log(d + 100);

import deep = Vec.Deep;
console.log(deep.tag);

// export import: a namespace re-exporting an alias of another namespace.
namespace Reex {
  export import geometry = Vec;
  export const viaAlias = geometry.dims * 10;
}
console.log(Reex.geometry.len2(1, 2), Reex.viaAlias);
console.log(Reex.geometry.Deep.tag);

// import= inside a namespace body, used by members of the SAME block.
namespace UsesAlias {
  import target = Vec;
  export function dims(): number {
    return target.dims;
  }
}
console.log(UsesAlias.dims());

// function+namespace merging: the callable and its namespace extras.
function stamp(n: number): string {
  return "#" + n;
}
namespace stamp {
  export const kind = "stamper";
}
console.log(stamp(3), stamp.kind);
