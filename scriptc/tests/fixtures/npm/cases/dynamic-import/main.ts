// Dynamic import() under --dynamic, differentially against Node: an ESM
// package and a CJS package load through the island's module system —
// `await import(spec)` parks the fiber on the bridged engine promise and
// resumes with the namespace HANDLE — plus a builtin shim namespace, member
// reads/calls and destructuring through the handles, and the engine
// registry's caching (a re-import is a lookup, not a re-evaluation).
async function run(): Promise<void> {
  // ESM package: named exports, a property read, and default() through the
  // namespace handle — primitive results exit to their declared types.
  const g = await import("greeter");
  const line: string = g.greet("island");
  console.log(line);
  console.log(g.punctuation);
  const shouted: string = g.default("dyn");
  console.log(shouted);
  // Destructuring straight off the namespace: the binding is a handle;
  // its calls are engine calls.
  const { greet } = await import("greeter");
  console.log(greet("again"));
  // CJS package: Node synthesizes named exports by LEXING the source —
  // the island's build-time facade (same lexer) must agree, including the
  // `module.exports = require(...)` forwarding and the esbuild __export
  // getter pattern.
  const z = await import("cjszoo");
  console.log(z.alpha);
  console.log(z.beta);
  console.log(z.gamma());
  console.log(z.extra);
  // Default of a CJS module IS module.exports.
  console.log(z.default.alpha);
  // Builtin shim: the namespace handle's members are the island shims,
  // answering exactly what Node's builtin answers.
  const path = await import("node:path");
  const joined: string = path.join("a", "b");
  console.log(joined);
  console.log(path.basename("/x/y/z.txt"));
  // The module registry caches: a second import of the same specifier is
  // a lookup — same module, same values.
  const g2 = await import("greeter");
  console.log(g2.greet("cached"));
}
run();
