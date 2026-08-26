// A class field declared `T | undefined` with NO initializer and NO
// constructor assignment satisfies strictPropertyInitialization (undefined
// is in the type), and Node defines it — value undefined — the moment the
// instance exists. A fresh-instance read must see that undefined, never
// zeroed memory: the assignment lives in a METHOD that hasn't run yet.
class Counter {
  n: number | undefined;
  label: string | undefined;
  flag: boolean | undefined;
  bump(): void {
    this.n = 1;
  }
  tag(): void {
    this.label = "ready";
    this.flag = true;
  }
}

const c = new Counter();
console.log(String(c.n), String(c.label), String(c.flag));
console.log(c.n === undefined, c.label === undefined, c.flag === undefined);
console.log(c.n ?? -1, c.label ?? "fallback", c.flag ?? false);
c.bump();
c.tag();
console.log(String(c.n), String(c.label), String(c.flag));
console.log(c.n === undefined, c.label === undefined, c.flag === undefined);
console.log(c.n ?? -1, c.label ?? "fallback", c.flag ?? false);

// A second fresh instance stays untouched by the first one's assignments.
const fresh = new Counter();
console.log(String(fresh.n), fresh.label ?? "still-fresh");
