// Class getters and setters: backing-field pairs, computed getters with no
// backing store, setters with validation logic, accessors calling other
// methods on this, string-typed accessors, getter-only properties.
class Temperature {
  _celsius: number = 0;
  get celsius(): number {
    return this._celsius;
  }
  set celsius(v: number) {
    this._celsius = v;
  }
  get fahrenheit(): number {
    return this._celsius * 1.8 + 32;
  }
  set fahrenheit(v: number) {
    this._celsius = (v - 32) / 1.8;
  }
}
const t = new Temperature();
t.celsius = 100;
console.log(t.celsius, t.fahrenheit);
t.fahrenheit = 32;
console.log(t.celsius, t.fahrenheit);

// Computed getters (no backing store), one calling a method on this.
class Rect {
  w: number;
  h: number;
  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
  }
  get area(): number {
    return this.w * this.h;
  }
  get label(): string {
    return "rect " + this.describe();
  }
  describe(): string {
    return this.w + "x" + this.h;
  }
}
const r = new Rect(3, 4);
console.log(r.area, r.label);
r.w = 5;
console.log(r.area, r.label);

// Setter with validation (clamping) — the setter decides what is stored.
class Gauge {
  _level: number = 0;
  get level(): number {
    return this._level;
  }
  set level(v: number) {
    if (v < 0) {
      v = 0;
    }
    if (v > 10) {
      v = 10;
    }
    this._level = v;
  }
}
const g = new Gauge();
g.level = 7;
console.log(g.level);
g.level = -3;
console.log(g.level);
g.level = 99;
console.log(g.level);

// String-typed accessor pair; the getter assembles, the setter records.
class Name {
  first: string = "Ada";
  history: string = "";
  get full(): string {
    return this.first + " Lovelace";
  }
  set full(v: string) {
    this.history = this.history + "[" + v + "]";
    this.first = v;
  }
}
const n = new Name();
console.log(n.full);
n.full = "Grace";
n.full = "Edsger";
console.log(n.full, n.history);

// Getter-only property (readonly by tsc; reads only).
class Circle2 {
  radius: number = 2;
  get circumference(): number {
    return 2 * 3.141592653589793 * this.radius;
  }
}
console.log(new Circle2().circumference);

// Accessors used from methods via this, including compound reads.
class Account {
  _balance: number = 100;
  get balance(): number {
    return this._balance;
  }
  set balance(v: number) {
    this._balance = v;
  }
  deposit(amount: number): number {
    this.balance = this.balance + amount;
    return this.balance;
  }
}
const acct = new Account();
console.log(acct.deposit(50), acct.balance);
