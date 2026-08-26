// Generic methods called through INTERFACE-typed receivers: when every
// member of the interface is a generic-callable method, a const binding
// initialized with `new C(...)` keeps the class representation (the record
// shape maps empty — generic members are excluded — and in JS the binding
// IS the instance), so calls monomorphize against the implementing class's
// bodies exactly like class-typed receivers. `this` works: state mutates
// on the one real instance.
interface Repo {
  get<T>(id: string, mk: () => T): T;
  put<T>(id: string, v: T): T;
}

class MemRepo implements Repo {
  private hits = 0;
  get<T>(id: string, mk: () => T): T {
    this.hits++;
    return mk();
  }
  put<T>(id: string, v: T): T {
    this.hits += 2;
    return v;
  }
  count(): number {
    return this.hits;
  }
}

const r: Repo = new MemRepo();
console.log(r.get("a", () => 42), r.get("b", () => "hi"), r.put("c", [1, 2, 3]).length);

// The binding holds the real instance: a cast reads the mutated state.
console.log((r as MemRepo).count());

// Identity and inspection behave like the instance they are.
console.log(typeof r, r === r);

// Block-scoped receivers take the same discipline.
function inBlock(): string {
  const r2: Repo = new MemRepo();
  return r2.get("k", () => "block") + r2.put("k2", "!");
}
console.log(inBlock());

// A second implementing class: each binding monomorphizes against its own
// class's bodies.
class DoubleRepo implements Repo {
  get<T>(id: string, mk: () => T): T {
    mk();
    return mk();
  }
  put<T>(id: string, v: T): T {
    return v;
  }
}
const d: Repo = new DoubleRepo();
let calls = 0;
console.log(
  d.get("z", () => {
    calls++;
    return calls * 10;
  }),
);

// Record-typed USES still work: the empty-shape width copy happens at the
// use site instead of the declaration.
function hold(x: Repo): string {
  return typeof x;
}
console.log(hold(r), hold(d));
const all: Repo[] = [r, d];
console.log(all.length);
