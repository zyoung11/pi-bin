// Classes as first-class values: the class STATIC side is a runtime object.
// Aliasing, identity, .name, statics through the value, construction and
// dispatch through the value — all against Node byte-for-byte.
class Animal {
  legs: number;
  constructor(legs?: number) {
    this.legs = legs ?? 4;
  }
  speak(): string {
    return "...";
  }
  static kingdom = "Animalia";
  static describe(n: number): string {
    return "animals: " + n;
  }
}
class Dog extends Animal {
  constructor(legs?: number) {
    super(legs);
  }
  speak(): string {
    return "woof";
  }
}

// The class object as a value: aliasing preserves identity.
const X = Animal;
console.log(X === Animal, Dog === (X as typeof Animal));
console.log(X.name, Dog.name, Animal.name);

// Construction through the value dispatches the right constructor; the
// instance behaves exactly like a directly-constructed one.
const a = new X(3);
console.log(a.legs, a.speak(), a instanceof Animal, a instanceof Dog);

// Statics read/call through the value (inherited statics included: Dog
// reads Animal's through the compile-time prototype chain).
console.log(X.kingdom, Dog.kingdom, X.describe(2), Animal.describe(1));

// Class values as function arguments and returns.
function pick(flag: boolean): typeof Animal {
  return flag ? Dog : Animal;
}
function makeAndSpeak(K: typeof Animal): string {
  const inst = new K();
  return inst.speak();
}
console.log(makeAndSpeak(pick(true)), makeAndSpeak(pick(false)));
console.log(pick(true) === Dog, pick(false) === Dog);

// A static method taken as a value keeps function identity.
const desc = Animal.describe;
console.log(desc(7), Animal.describe === desc ? "same" : "different");

// Truthiness: class objects are JS objects.
console.log(X ? "truthy" : "falsy");
