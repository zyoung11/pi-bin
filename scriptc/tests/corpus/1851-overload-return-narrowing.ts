// Overloads whose RETURN types differ: the call site's type is the
// RESOLVED overload's return (tsc's answer), but the value arrives
// through the implementation's ABI — a union. The lowering bridges with
// the CHECKED single-arm extraction (`x!`'s machinery): the runtime tag
// must match the resolved arm, so an implementation that lied about an
// overload would throw the catchable TypeError instead of a misread
// payload. Honest implementations (like these) never hit the check.
function pick(kind: "s"): string;
function pick(kind: "n"): number;
function pick(kind: "s" | "n"): string | number {
  return kind === "s" ? "alpha" : 42;
}

const s = pick("s");
const n = pick("n");
console.log(s.length, n + 1);
console.log(pick("s"), pick("n"));

// Resolved overload returning a SUB-UNION of the implementation's union:
// the ordinary re-tag bridge (stranded arms trap — the lying-cast stance).
function three(k: "a"): string | number;
function three(k: "b"): boolean;
function three(k: "a" | "b"): string | number | boolean {
  return k === "a" ? "wide" : true;
}
const sub = three("a");
if (typeof sub === "string") {
  console.log(sub + "!");
} else {
  console.log(sub - 1);
}
console.log(three("b"));

// A DISCARDED overloaded-call result never looks at the bridge.
pick("s");
console.log("done");
