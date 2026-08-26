// Two records referencing each other through closure fields: a.peer's
// closure captures b's binding and b.peer's captures a's, so the pair forms
// record -> closure -> box -> record -> closure -> box -> record. (Recursive
// record SHAPES are untypeable here — SC2001 — so the closure field is the
// way records point at each other.) Prints are liveness markers; the
// sanitized lane asserts every dropped pair is collected.
type Node = { name: string; peer: () => string };

function makePair(tag: string): string {
  let a: Node = { name: tag + "-a", peer: (): string => "unset" };
  let b: Node = { name: tag + "-b", peer: (): string => a.name };
  a.peer = (): string => b.name;
  return a.peer() + "/" + b.peer();
}

console.log(makePair("p1"));
for (let i = 0; i < 300; i = i + 1) {
  makePair(`loop${i}`);
}
console.log("done");
