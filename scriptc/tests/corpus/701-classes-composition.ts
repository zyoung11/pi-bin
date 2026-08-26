// Objects holding strings, arrays, and other objects (acyclic).
class Name {
  full: string;
  constructor(full: string) {
    this.full = full;
  }
  initials(): string {
    return this.full.charAt(0) + ".";
  }
}
class Person {
  name: Name;
  tags: string[] = [];
  score: number = 0;
  constructor(name: Name) {
    this.name = name;
  }
  tag(t: string): number {
    return this.tags.push(t);
  }
  summary(): string {
    return `${this.name.full} [${this.tags.length} tags, score ${this.score}]`;
  }
}
const p = new Person(new Name("Ada Lovelace"));
p.tag("math");
p.tag("computing");
console.log(p.name.full, p.name.initials(), p.tags[1]);
p.name = new Name("Grace Hopper");
p.score += 10;
console.log(p.summary());

// objects through functions: aliasing, mutation, returns
function promote(person: Person, points: number): Person {
  person.score += points;
  return person;
}
const q = promote(p, 5);
console.log(q === p, q.score);

// methods calling methods; objects in loops (created and dropped)
class Accumulator {
  total: number = 0;
  add(n: number): void {
    this.total += n;
  }
  addAll(values: number[]): void {
    for (const v of values) {
      this.add(v);
    }
  }
}
let last = 0;
for (let i = 0; i < 4; i++) {
  const acc = new Accumulator();
  acc.addAll([i, i * 2, i * 3]);
  last = acc.total;
}
console.log(last);

// field initialization order is declaration order
class Ordered {
  first: string = firstInit();
  second: string = secondInit();
}
function firstInit(): string {
  console.log("init first");
  return "1st";
}
function secondInit(): string {
  console.log("init second");
  return "2nd";
}
const o = new Ordered();
console.log(o.first, o.second);
