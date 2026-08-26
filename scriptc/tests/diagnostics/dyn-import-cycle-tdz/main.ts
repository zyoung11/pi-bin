// @dynamic
// The REFUSED shape through the --dynamic subgraph: the cycle behind this
// import() reads a cycle-crossing binding at a module's top level, which
// in Node observes the partially-initialized exporter (TDZ
// ReferenceError). The dynamic-subgraph walk fences it with the same
// narrowed SC1016 preflight's static walk mints, naming the binding and
// the offending line.
async function main(): Promise<void> {
  const ns = await import("./a.ts");
  console.log(ns.useB());
}
main();
