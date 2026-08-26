// util.inspect over classes, functions, and regexes: "Name { fields }"
// instance forms with inherited-field layout order, "Name {}" empties,
// [ClassName] depth placeholders, the baked [Function: name] /
// [class X extends Y] forms for direct identifiers, and /source/flags
// regex rendering. Node is the oracle byte-for-byte.
import { inspect } from "node:util";

class Point {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
console.log(inspect(new Point(1, 2)));
console.log(inspect(new Point(-0, 1e21)));

class Empty {}
console.log(inspect(new Empty()));

class Holder {
  label: string;
  points: Point[];
  constructor(label: string) {
    this.label = label;
    this.points = [new Point(1, 2), new Point(3, 4)];
  }
}
console.log(inspect(new Holder("box")));

// inherited fields come first (base-chain layout = insertion order)
class Base {
  a: number;
  constructor() {
    this.a = 1;
  }
}
class Derived extends Base {
  b: string;
  constructor() {
    super();
    this.b = "two";
  }
}
console.log(inspect(new Derived()));

// depth placeholders name the class
console.log(inspect({ deep: { deeper: new Point(1, 2) } }));
console.log(inspect({ deep: { deeper: { deepest: new Point(1, 2) } } }));
console.log(inspect(new Point(1, 2), { depth: -1 }));

// functions by declared name; inline literals are anonymous
function namedFn(): void {}
const arrowBound = (): number => 1;
console.log(inspect(namedFn));
console.log(inspect(arrowBound));
console.log(inspect(() => 0));

// classes as values: [class X] / [class X extends Y]
console.log(inspect(Point));
console.log(inspect(Derived));

// regexes render fully at any depth
console.log(inspect(/ab+c/gi));
console.log(inspect(/^\d{3}-\d{4}$/));
console.log(inspect({ deep: { deeper: { pattern: /x/m } } }));
