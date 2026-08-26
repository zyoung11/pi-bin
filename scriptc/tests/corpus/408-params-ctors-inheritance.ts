// Optional/default/rest parameters on constructors, including through
// inheritance: a derived class without a constructor inherits the base's
// signature, and the synthesized forwarder passes the completed values to
// super() unchanged — defaults apply exactly once, in the base.
function loudDefault(): number {
  console.log("default ran");
  return 99;
}
class Point {
  x: number;
  y: number;
  label: string;
  constructor(x: number, y: number = x + 1, label?: string) {
    this.x = x;
    this.y = y;
    this.label = label === undefined ? "p" : label;
  }
  show(): string {
    return this.label + "(" + this.x + "," + this.y + ")";
  }
}
console.log(new Point(1).show());
console.log(new Point(1, 5).show());
console.log(new Point(1, 5, "named").show());
console.log(new Point(2, undefined, "d").show());

class Tagged extends Point {}
console.log(new Tagged(7).show());
console.log(new Tagged(7, 0, "t").show());

class Shifted extends Point {
  constructor(x: number, dx: number = 100) {
    super(x + dx, undefined, "s");
  }
}
console.log(new Shifted(1).show());
console.log(new Shifted(1, 2).show());

// Defaults evaluate on ctor entry, before field initializers run.
class Noisy {
  ready: boolean = true;
  constructor(n: number = loudDefault()) {
    console.log("body sees " + n + " ready=" + this.ready);
  }
}
new Noisy();
new Noisy(5);

// Rest params on constructors pack per new-site.
class Bag {
  size: number;
  first: string;
  constructor(...items: string[]) {
    this.size = items.length;
    this.first = items.length > 0 ? items[0] : "-";
  }
}
console.log(new Bag().size, new Bag("a").first, new Bag("a", "b", "c").size);

class BigBag extends Bag {}
console.log(new BigBag("x", "y").size, new BigBag().first);
