// Accessor side-effect ORDER, differential against Node: simple assignment
// runs receiver→rhs→setter; compound assignment runs receiver→getter→rhs→
// setter; ++/-- run getter then setter. Every step prints.
class Counter {
  _x: number = 0;
  get x(): number {
    console.log("get -> " + this._x);
    return this._x;
  }
  set x(v: number) {
    console.log("set " + v);
    this._x = v;
  }
}
function rhs(n: number): number {
  console.log("rhs " + n);
  return n;
}
const c = new Counter();
console.log("-- simple assignment");
c.x = rhs(1);
console.log("-- compound +=");
c.x += rhs(2);
console.log("-- compound *=");
c.x *= rhs(3);
console.log("-- increment");
c.x++;
console.log("-- decrement");
c.x--;
console.log("final " + c._x);

// String compound through accessors, order included.
class Log {
  _s: string = "";
  get s(): string {
    console.log("get s");
    return this._s;
  }
  set s(v: string) {
    console.log("set s to " + v);
    this._s = v;
  }
}
function piece(p: string): string {
  console.log("piece " + p);
  return p;
}
const l = new Log();
l.s += piece("a");
l.s += piece("b");
console.log(l.s);

// Compound through `this` inside a method.
class Acc {
  _n: number = 0;
  get n(): number {
    console.log("this.get");
    return this._n;
  }
  set n(v: number) {
    console.log("this.set " + v);
    this._n = v;
  }
  bump(by: number): void {
    this.n += by;
  }
}
const a = new Acc();
a.bump(5);
a.bump(2);
console.log(a._n);
