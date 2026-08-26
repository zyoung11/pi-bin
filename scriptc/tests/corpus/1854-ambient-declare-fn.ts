// Ambient `declare function` NOTHING defines: Node erases the declaration
// and the reference throws the catchable ReferenceError "<name> is not
// defined" at the use site — the ambient `declare const` / ambient-
// namespace stance. The callee evaluates FIRST, so arguments never run.
declare function mystery(x: number): string;
declare function generic<T>(obj: T): T;

console.log("before");

try {
  mystery(1);
} catch (e) {
  if (e instanceof Error) console.log("call:", e.name + ": " + e.message);
}

try {
  generic({ p: "payload" });
} catch (e) {
  if (e instanceof Error) console.log("generic:", e.name + ": " + e.message);
}

let evaluated = false;
function arg(): number {
  evaluated = true;
  return 1;
}
try {
  mystery(arg());
} catch (e) {
  if (e instanceof Error) console.log("args ran:", evaluated, "-", e.name);
}

console.log("after");
