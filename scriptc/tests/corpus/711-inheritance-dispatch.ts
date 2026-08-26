// Dynamic dispatch: overridden methods called through base-typed
// references run the DERIVED implementation (the classic shapes example),
// while never-overridden methods stay correct through any static type.
class Shape {
  label: string;
  constructor(label: string) {
    this.label = label;
  }
  area(): number {
    return 0;
  }
  name(): string {
    return this.label; // never overridden anywhere: devirtualized
  }
  report(): string {
    // A base-class method calling a virtual one on its own `this` still
    // dispatches on the dynamic class.
    return `${this.name()}: ${this.area()}`;
  }
}
class Circle extends Shape {
  r: number;
  constructor(r: number) {
    super("circle");
    this.r = r;
  }
  area(): number {
    return 3 * this.r * this.r;
  }
}
class Square extends Shape {
  side: number;
  constructor(side: number) {
    super("square");
    this.side = side;
  }
  area(): number {
    return this.side * this.side;
  }
}
class DoubleSquare extends Square {
  constructor(side: number) {
    super(side);
    this.label = "double-square";
  }
  area(): number {
    return 2 * super.area(); // super.method(): the BASE implementation
  }
}

const c = new Circle(2);
const s = new Square(3);
const ds = new DoubleSquare(3);
console.log(c.area(), s.area(), ds.area());

function measure(sh: Shape): number {
  return sh.area(); // virtual through the base type
}
console.log(measure(c), measure(s), measure(ds));
console.log(c.report(), s.report(), ds.report());

// Leaf-typed receivers of an overridden method are still exact.
const viaSquare: Square = ds;
console.log(viaSquare.area(), viaSquare.name());

// Reference identity survives widening: base === derived on the same object.
const wide: Shape = ds;
const other: Shape = c;
console.log(wide === ds, wide === s, other !== s);
