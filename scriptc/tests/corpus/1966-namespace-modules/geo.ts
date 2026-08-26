// The exporting module: a namespace as a module export, plus a merged
// dotted extension. Body statements run when THIS module initializes —
// before the importer's body, in module order.
console.log("geo module body start");
export namespace Geo {
  export const origin = 0;
  export function dist(a: number, b: number): number {
    return a > b ? a - b : b - a;
  }
  export class P {
    x: number;
    constructor(x: number) {
      this.x = x;
    }
    away(): number {
      return Geo.dist(this.x, Geo.origin);
    }
  }
  console.log("Geo body ran");
}
export namespace Geo.Deep {
  export const label = "deep-label";
}
console.log("geo module body end");
