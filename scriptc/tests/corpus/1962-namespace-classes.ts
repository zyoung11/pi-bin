// @transform-types
// Classes inside namespaces: qualified construction (new N.C), instances
// as ordinary values, inheritance across the namespace boundary, statics
// interleaved at the class statement's init position, and merging a class
// with a namespace (the namespace's exports resolve statically off the
// class name).
namespace Shapes {
  export class Square {
    side: number;
    constructor(side: number) {
      this.side = side;
    }
    area(): number {
      return this.side * this.side;
    }
  }
  export class Cube extends Square {
    volume(): number {
      return this.area() * this.side;
    }
  }
  export function total(shapes: Square[]): number {
    let sum = 0;
    for (const s of shapes) sum += s.area();
    return sum;
  }
}

const sq = new Shapes.Square(3);
const cu = new Shapes.Cube(2);
console.log(sq.area(), cu.area(), cu.volume());
console.log(Shapes.total([sq, cu]));
console.log(sq instanceof Shapes.Square, cu instanceof Shapes.Square);

// A subclass OUTSIDE the namespace extends the qualified base.
class Tower extends Shapes.Cube {
  floors(): number {
    return this.side * 10;
  }
}
const tw = new Tower(4);
console.log(tw.area(), tw.volume(), tw.floors());

// Class-with-namespace merging: instance members from the class, extras
// from the namespace, both off one name.
class Logger {
  prefix: string;
  constructor(prefix: string) {
    this.prefix = prefix;
  }
  line(msg: string): string {
    return this.prefix + msg;
  }
}
namespace Logger {
  export const defaultPrefix = "[log] ";
  export function make(): Logger {
    return new Logger(defaultPrefix);
  }
}
const lg = Logger.make();
console.log(lg.line("hello"), Logger.defaultPrefix.length);

// Static blocks of namespace classes run at the class statement, in
// source order with the surrounding init statements.
console.log("before Staticy");
namespace Staticy {
  export class K {
    static {
      console.log("K static block ran");
    }
  }
}
console.log("after Staticy");
const k = new Staticy.K();
console.log(typeof k === "object");
