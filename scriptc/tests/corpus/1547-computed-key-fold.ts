// `{ [MARKER]: v }` — a computed key whose expression is a const with ONE
// string-literal type folds at compile time into an ordinary property name
// (the elevated-env marker idiom), in single literals and among merge
// contributors alike; JS's own-key order is preserved.
const MARKER = "PORTLESS_INTERNAL_ELEVATED";
const OTHER = "X_OTHER";
function build(extra: Record<string, string>): Record<string, string> {
  return { [MARKER]: "1", plain: "p", ...extra, [OTHER]: "o" };
}
const r = build({ EXTRA: "e" });
console.log(Object.keys(r).join(","), r[MARKER], r["plain"], r["EXTRA"], r[OTHER]);
const r2 = build({ [MARKER]: "overridden" });
console.log(Object.keys(r2).join(","), r2[MARKER]);
const single: Record<string, string> = { [MARKER]: "1" };
console.log(Object.keys(single).join(","), single[MARKER]);
interface Opts {
  extraEnv: Record<string, string>;
}
function useOpts(o: Opts): string {
  const v = o.extraEnv[MARKER];
  return v !== undefined ? v : "(unset)";
}
console.log(useOpts({ extraEnv: { [MARKER]: "1" } }));
