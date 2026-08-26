// Constructor and method overload SIGNATURES are type-world (lower to
// nothing); construction and calls flow through the implementation's ABI,
// and method calls whose resolved overload narrows the implementation's
// union return ride the same checked bridge as top-level functions.
class Box {
  v: string | number;
  constructor(v: string);
  constructor(v: number, scale: number);
  constructor(v: string | number, scale?: number) {
    this.v = typeof v === "number" && scale !== undefined ? v * scale : v;
  }
  pick(kind: "s"): string;
  pick(kind: "n"): number;
  pick(kind: "s" | "n"): string | number {
    return kind === "s" ? "text-" + String(this.v) : 7;
  }
  label(prefix: string): string;
  label(): string;
  label(prefix?: string): string {
    return (prefix ?? "box:") + String(this.v);
  }
}

const a = new Box("hi");
const b = new Box(6, 7);
console.log(a.label(), b.label("scaled:"));
console.log(a.pick("s").length, b.pick("n") + 1);

// Overloaded method through the vtable: a subclass overrides the
// implementation with the exact ABI; dispatch stays dynamic and each
// call site still narrows by its resolved overload.
class Loud extends Box {
  pick(kind: "s"): string;
  pick(kind: "n"): number;
  pick(kind: "s" | "n"): string | number {
    return kind === "s" ? "LOUD" : 100;
  }
}
const boxes: Box[] = [new Box("q"), new Loud("q")];
for (const box of boxes) {
  console.log(box.pick("s"), box.pick("n"));
}
