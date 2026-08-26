// @transform-types
// Structural width subtyping, class VALUE → record: a class whose static
// side matches an interface projects into the record — static methods as
// the zero-capture closures `const f = C.m` builds, static fields as
// copies of their globals (divergence 305's copy stance).
class Shape {
  constructor(public size: number) {}
  static create(): Shape {
    return new Shape(42);
  }
  static kind = "shape";
}

interface ShapeFactory {
  create(): Shape;
}

const f: ShapeFactory = Shape;
const made = f.create();
console.log(made.size);
console.log(made instanceof Shape);

// Static FIELD projection rides along.
const tagged: { kind: string; create(): Shape } = Shape;
console.log(tagged.kind, tagged.create().size);