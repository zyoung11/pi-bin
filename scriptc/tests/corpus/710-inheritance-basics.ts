// Single inheritance: base/derived field access through both static types,
// super(...) with arguments, derived field initializers, and inherited
// methods called through derived references.
class Animal {
  name: string;
  legs: number = 4;
  constructor(name: string) {
    this.name = name;
  }
  describe(): string {
    return `${this.name} (${this.legs} legs)`;
  }
}
class Dog extends Animal {
  breed: string;
  goodBoy: boolean = true;
  constructor(name: string, breed: string) {
    super(name);
    this.breed = breed;
  }
}
class Bird extends Animal {
  constructor(name: string) {
    super(name);
    this.legs = 2;
  }
}

const d = new Dog("rex", "lab");
console.log(d.name, d.breed, d.legs, d.goodBoy);
console.log(d.describe()); // inherited method through a derived reference

const a: Animal = d; // implicit upcast into a base-typed local
console.log(a.name, a.legs);
a.legs = 3; // base-field write through the base type is the same storage
console.log(d.legs, d.describe());

const b = new Bird("tweety");
console.log(b.describe());

// Derived constructor omitted: the base's signature is inherited and the
// derived field initializer still runs.
class Puppy extends Dog {
  toys: number = 7;
}
const p = new Puppy("spot", "beagle");
console.log(p.name, p.breed, p.toys, p.describe());

// Base-typed params and returns accept derived values.
function tag(x: Animal): string {
  return `<${x.describe()}>`;
}
function pick(which: boolean): Animal {
  return which ? new Dog("d", "mix") : new Bird("b");
}
console.log(tag(d), tag(b), tag(p));
console.log(pick(true).legs, pick(false).legs);
