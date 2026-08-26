// The base constructor runs BEFORE the derived class's own field
// initialization (JS defines derived fields when super() returns), so a
// virtual call from the base constructor can read a derived field that
// does not exist yet — Node answers undefined, and so must the native
// layout. The self-referential class below takes the same fresh-instance
// path through the cycle-capable allocator.
class Base {
  constructor() {
    this.report();
  }
  report(): void {
    console.log("base");
  }
}
class Derived extends Base {
  status: string | undefined;
  report(): void {
    console.log("mid-super:", String(this.status), this.status === undefined);
  }
}

const d = new Derived();
console.log("after-ctor:", String(d.status));
d.status = "done";
console.log("after-assign:", String(d.status));
d.report();

// Cycle-capable shape (self-referential field): unassigned reads first,
// then a real cycle the collector must still reclaim.
class Link {
  next: Link | undefined;
  name: string | undefined;
}
const link = new Link();
console.log(link.next === undefined, String(link.name));
link.next = link;
link.name = "self";
console.log(link.next === link, String(link.name));
