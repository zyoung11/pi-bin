// Object destructuring of CLASS instances: one member read per element,
// left to right at the element's position — fields read slots, accessor
// properties call their getters (observably, like JS), renames and
// parameter patterns ride the same desugar, and defaults follow the
// undefined-arm rule. the pattern's AstPath { previous, next } idiom.
class AstPath {
  stack: string[] = ["root", "mid", "leaf"];
  label = "path";
  get parent(): string {
    console.log("get parent");
    return this.stack[this.stack.length - 2]!;
  }
  get current(): string {
    return this.stack[this.stack.length - 1]!;
  }
  get previous(): string | undefined {
    return this.stack.length > 1 ? this.stack[this.stack.length - 2] : undefined;
  }
}
class SubPath extends AstPath {
  extra = 7;
}

const p = new AstPath();
const { parent, current } = p;
console.log(parent, current);
const { parent: renamed, label } = p;
console.log(renamed, label);

function describe({ current: c, label: l }: AstPath): string {
  return `${l}:${c}`;
}
console.log(describe(p));

// Defaults: the getter's undefined arm fires the default lazily.
const empty = new AstPath();
empty.stack = ["only"];
const { previous = "(none)" } = empty;
console.log(previous);

// Inherited accessors through a subclass instance.
const s = new SubPath();
const { current: sc, extra } = s;
console.log(sc, extra);
