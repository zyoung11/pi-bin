// @transform-types
// Nested and dotted namespaces: `export namespace` nesting, dotted
// declarations (namespace A.B.C), references INTO enclosing blocks
// (lexically bound in the emitted nesting — those bare reads are fine,
// unlike cross-block ones), and a generic function member monomorphized
// through the qualified call.
namespace Outer {
  export const base = 2;
  export namespace Inner {
    export const scaled = base * 10; // enclosing-block bare read: lexical
    export function describe(): string {
      return "inner sees base=" + base;
    }
    export namespace Deepest {
      export const mark = "deepest";
    }
  }
  export const fromInner = Inner.scaled + 1;
}

console.log(Outer.base, Outer.Inner.scaled, Outer.fromInner);
console.log(Outer.Inner.describe());
console.log(Outer.Inner.Deepest.mark);

namespace Dotted.Path.Here {
  export const v = "dotted";
  export function shout(): string {
    return v.toUpperCase();
  }
}
namespace Dotted.Path {
  export const sibling = "sibling";
}
console.log(Dotted.Path.Here.v, Dotted.Path.Here.shout(), Dotted.Path.sibling);

// A non-exported nested namespace is block-local; its members reach out
// through the block's own exports.
namespace Wrap {
  namespace hidden {
    export const secret = 42;
  }
  export function reveal(): number {
    return hidden.secret;
  }
}
console.log(Wrap.reveal());

// Generic function member: each qualified call monomorphizes like a
// top-level generic.
namespace G {
  export function pair<T>(x: T): string {
    return `${x}|${x}`;
  }
}
console.log(G.pair(5), G.pair("ab"), G.pair(true));

// Namespace body statements interleave with top-level statements in
// source order.
console.log("before Late");
namespace Late {
  console.log("Late body ran");
  export const done = true;
}
console.log("after Late", Late.done);
