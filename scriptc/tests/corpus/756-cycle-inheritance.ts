// A reference cycle THROUGH a base-typed field: the owner stores its pet
// in a Pet-typed slot that actually holds a Dog pointing back at the
// owner. The collector's trace must follow the base-typed edge into the
// DERIVED object's trace (stamped at allocation), and teardown through the
// vtable must release the derived fields — the sanitized lane asserts
// every dropped pair is collected.
class Pet {
  tag: string;
  constructor(tag: string) {
    this.tag = tag;
  }
  describe(): string {
    return this.tag;
  }
}
class Dog extends Pet {
  owner: Owner;
  constructor(tag: string, owner: Owner) {
    super(tag);
    this.owner = owner;
  }
  describe(): string {
    return `${this.tag} of ${this.owner.label}`;
  }
}
class Owner {
  label: string;
  pet: Pet;
  constructor(label: string) {
    this.label = label;
    this.pet = new Pet("none");
  }
}

function spin(label: string): string {
  const o = new Owner(label);
  o.pet = new Dog(`${label}-dog`, o); // Owner -> (Pet-typed) Dog -> Owner
  return o.pet.describe(); // virtual through the base-typed field
}
console.log(spin("one"));
for (let i = 0; i < 400; i++) {
  spin(`x${i}`);
}
console.log(spin("two"));

// The same shape via instanceof narrowing: reach back around the cycle.
const home = new Owner("home");
home.pet = new Dog("buddy", home);
if (home.pet instanceof Dog) {
  console.log(home.pet.owner === home, home.pet.owner.pet.describe());
}
