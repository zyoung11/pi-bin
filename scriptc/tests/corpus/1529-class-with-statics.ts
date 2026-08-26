// A class CARRYING static members compiles for its instance surface —
// statics no longer poison the declaration (their uses fence per site;
// none here). The RouteStore shape: instance fields from constructor
// args, private methods, an unused static utility slot.
class Store {
  static readonly MODE = 0o644; // unused: must not sink the class
  private static instances = 0;
  static describe(): string {
    return "unreached";
  }
  readonly dir: string;
  private items: string[] = [];
  constructor(dir: string) {
    this.dir = dir + "/state";
  }
  add(name: string): number {
    this.items.push(name);
    return this.items.length;
  }
  list(): string {
    return this.items.join(",");
  }
}
const s = new Store("/tmp");
console.log(s.dir, s.add("a"), s.add("b"), s.list());
const t = new Store("/var");
console.log(t.list() === "", t.dir);
