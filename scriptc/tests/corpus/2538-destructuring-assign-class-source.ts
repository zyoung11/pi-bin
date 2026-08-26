// Destructuring assignment FROM class instances: field reads, getter
// calls at the element's pattern position, inherited members, defaults
// against the target's own type, renames, and member targets fed from a
// class source.
class Base {
  root = "r";
}
class Item extends Base {
  id = 7;
  label = "seven";
  get loud(): string {
    return this.label.toUpperCase();
  }
}
const item = new Item();

let id = 0;
let label = "";
({ id, label } = item);
console.log(id, label);

// Renames and getters.
let shout = "";
let from = "";
({ loud: shout, root: from } = item);
console.log(shout, from);

// Defaults from undefined-armed class fields.
class Sparse {
  hit?: number;
  miss?: number;
  constructor() {
    this.hit = 3;
  }
}
let hit = -1;
let miss = -1;
({ hit = -10, miss = -20 } = new Sparse());
console.log(hit, miss);

// A class source feeding MEMBER targets.
const sink = { a: 0, b: "" };
({ id: sink.a, label: sink.b } = item);
console.log(sink.a, sink.b);

// Getters run ONCE per element, at the element's position.
const order: string[] = [];
class Tracked {
  get first(): number {
    order.push("first");
    return 1;
  }
  get second(): number {
    order.push("second");
    return 2;
  }
}
let f = 0;
let sec = 0;
({ second: sec, first: f } = new Tracked());
console.log(order.join(","), f, sec);

// Expression-position class-source assignment keeps the RHS value.
let again = 0;
const same = ({ id: again } = item);
console.log(again, same.label);
