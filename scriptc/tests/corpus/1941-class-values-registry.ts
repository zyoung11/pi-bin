// The registry/factory idiom: classes in arrays and Maps, construction
// through constructor-typed slots, instanceof against dynamic targets.
class Shape {
  sides = 0;
  constructor() {}
  name(): string {
    return "shape";
  }
}
class Triangle extends Shape {
  constructor() {
    super();
    this.sides = 3;
  }
  name(): string {
    return "triangle";
  }
}
class Square extends Shape {
  constructor() {
    super();
    this.sides = 4;
  }
  name(): string {
    return "square";
  }
}

// An array of class values (annotated with the common base's static side).
const registry: (typeof Shape)[] = [Triangle, Square, Shape];
for (const K of registry) {
  const s = new K();
  console.log(K.name, s.name(), s.sides, s instanceof K, s instanceof Triangle);
}

// Constructor-signature types: `new () => T` slots accept class values.
const make: new () => Shape = Square;
const sq = make === Square ? new make() : new Shape();
console.log(sq.name(), sq.sides, sq instanceof Square);

// A Map of classes — string keys to class-object values.
const byName = new Map<string, typeof Shape>();
byName.set("tri", Triangle);
byName.set("sq", Square);
const hit = byName.get("tri");
if (hit !== undefined) {
  const t = new hit();
  console.log(t.name(), hit === Triangle, byName.size);
}

// instanceof with a DYNAMIC right-hand side distinguishes siblings.
function isA(v: Shape, K: typeof Shape): boolean {
  return v instanceof K;
}
console.log(isA(new Triangle(), Triangle), isA(new Triangle(), Square), isA(new Square(), Shape));

// Array intrinsics over class values: identity search.
console.log(registry.indexOf(Square), registry.includes(Triangle), registry.length);
