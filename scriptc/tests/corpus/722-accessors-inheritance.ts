// Accessors under inheritance: overridden getters dispatch on the DYNAMIC
// class through base-typed references; a getter-only override SHADOWS the
// whole inherited pair (a base-typed write throws, exactly like Node);
// super.x reads and super.x = v writes call the base accessors directly.
class Shape {
  _scale: number = 1;
  get scale(): number {
    return this._scale;
  }
  set scale(v: number) {
    this._scale = v;
  }
  get kind(): string {
    return "shape";
  }
}
class Circle extends Shape {
  get kind(): string {
    return "circle";
  }
}
class Square extends Shape {
  get kind(): string {
    return "square (was " + super.kind + ")";
  }
}
function describe(s: Shape): string {
  return s.kind + " @" + s.scale;
}
const c = new Circle();
const q = new Square();
c.scale = 3;
q.scale = 4;
console.log(describe(new Shape()));
console.log(describe(c));
console.log(describe(q));

// Getter-only override of an inherited get/set pair: JS gives the derived
// class ONE own accessor that shadows the pair, so writing through a
// base-typed reference throws a catchable TypeError. Reads virtually
// dispatch to the override.
class Cell {
  _v: number = 10;
  get v(): number {
    return this._v;
  }
  set v(x: number) {
    this._v = x;
  }
}
class FrozenCell extends Cell {
  get v(): number {
    return 42;
  }
}
const plain = new Cell();
plain.v = 7;
console.log(plain.v);
const frozen: Cell = new FrozenCell();
console.log(frozen.v);
try {
  frozen.v = 99;
  console.log("write went through");
} catch {
  console.log("write threw");
}
console.log(frozen.v, frozen._v);

// Overriding BOTH halves, with super delegation in each direction.
class Meters {
  _m: number = 0;
  get m(): number {
    return this._m;
  }
  set m(v: number) {
    this._m = v;
  }
}
class Kilometers extends Meters {
  get m(): number {
    return super.m / 1000;
  }
  set m(v: number) {
    super.m = v * 1000;
  }
}
const k = new Kilometers();
k.m = 2;
console.log(k.m, k._m);
const asMeters: Meters = k;
asMeters.m = 3000;
console.log(k.m, k._m);

// A derived class ADDING accessors the base never had, next to inherited
// ones — and an accessor calling an overridden method on this.
class Animal {
  name: string = "generic";
  speak(): string {
    return "...";
  }
  get intro(): string {
    return this.name + " says " + this.speak();
  }
}
class Dog extends Animal {
  speak(): string {
    return "woof";
  }
  get loudIntro(): string {
    return this.intro + "!!";
  }
}
const d = new Dog();
d.name = "Rex";
console.log(d.loudIntro);
const a: Animal = d;
console.log(a.intro);
