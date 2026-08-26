// `#x in obj` — the ergonomic brand check. In this closed world the brand IS instance-of-the-declaring-class: receivers at/below the declarer fold true, disjoint classes fold false, a receiver typed ABOVE the declarer runs the vtable interval test (the narrowing use — tsc types the true branch at the class and member reads ride the downcast), and unions of classes discriminate through their tags, both polarities. Field and method brands answer identically (JS installs both during construction).
class Node2 {
  kind = "n";
}
class Leaf extends Node2 {
  #payload = "leaf-data";
  #tag(): string {
    return "leaf";
  }
  static dataOf(n: Node2): string {
    // Runtime direction: declarer strictly below the static class.
    if (#payload in n) {
      return n.#payload;
    }
    return "none";
  }
  static kindOf(n: Node2): string {
    // Method brands answer exactly like field brands.
    return #tag in n ? n.#tag() : "other";
  }
}
class Branch extends Node2 {
  width = 2;
}
function make(i: number): Node2 {
  return i === 0 ? new Leaf() : i === 1 ? new Branch() : new Node2();
}
console.log(Leaf.dataOf(make(0)), Leaf.dataOf(make(1)), Leaf.dataOf(make(2)));
console.log(Leaf.kindOf(make(0)), Leaf.kindOf(make(2)));

// Static folds: `this` and same-class receivers are true, disjoint
// classes false — and negation composes.
class Self {
  #m(): number {
    return 7;
  }
  probe(): boolean {
    return #m in this;
  }
  refute(other: Plain): boolean {
    return !(#m in other);
  }
}
class Plain {
  p = 1;
}
console.log(new Self().probe(), new Self().refute(new Plain()));

// Union discrimination: every arm answers statically, the test collapses
// to tag tests — one true arm, one false arm, and the multi-arm OR chain.
class Ax {
  #a = 1;
  static is(o: Ax | Bx): string {
    return #a in o ? "ax" : "bx";
  }
  static isEither(o: Ax | Bx | Cx): string {
    if (#a in o) return "first";
    return "rest";
  }
}
class Bx {
  b = "b";
}
class Cx {
  c = true;
}
function pick(i: number): Ax | Bx {
  return i === 0 ? new Ax() : new Bx();
}
console.log(Ax.is(pick(0)), Ax.is(pick(1)));
function pick3(i: number): Ax | Bx | Cx {
  return i === 0 ? new Ax() : i === 1 ? new Bx() : new Cx();
}
console.log(Ax.isEither(pick3(0)), Ax.isEither(pick3(1)), Ax.isEither(pick3(2)));

// Subclass instances carry the base's brand: at/below folds true even
// through a base-typed slot holding the subclass.
class Animal {
  #dna = "acgt";
  static sequenced(a: Animal): boolean {
    return #dna in a;
  }
  read(): string {
    return this.#dna;
  }
}
class Dog extends Animal {
  barks = true;
}
const pet: Animal = new Dog();
console.log(Animal.sequenced(pet), pet.read());
