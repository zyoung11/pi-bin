// The checker-`any` tail over JSON.parse results: ternary joins with
// static arms, const declarations adopting their initializer's IR type,
// element access on any receivers with static-array lowerings, and
// typeof (v as T).field as the raw keyed read.

// Ternary join + decl adoption (the workspace.ts name-normalization shape).
function readName(raw: string): string | null {
  const pkg = JSON.parse(raw);
  const rawName = typeof pkg.name === "string" ? pkg.name : null;
  const name = rawName ? rawName.replace(/^@[^/]+\//, "") : null;
  return name;
}
for (const raw of ['{"name":"@scope/pkg"}', '{"name":"plain"}', '{"version":1}', '{"name":42}']) {
  const n = readName(raw);
  console.log(n === null ? "none" : n);
}

// Element access on a checker-`any` receiver whose IR is a static array
// (the packageManager detection shape).
function detectPm(raw: string): string {
  const pkg = JSON.parse(raw);
  if (typeof pkg.packageManager === "string") {
    const name = pkg.packageManager.split("@")[0] as string;
    if (name === "pnpm" || name === "yarn" || name === "bun" || name === "npm") {
      return name;
    }
    return "unknown";
  }
  return "absent";
}
console.log(detectPm('{"packageManager":"pnpm@9.1.0"}'));
console.log(detectPm('{"packageManager":"deno@1"}'));
console.log(detectPm('{"packageManager":7}'));
console.log(detectPm("{}"));

// typeof (value as T).field — the raw-object validation idiom: the `as`
// is erasure, the read answers the dynamic member (missing -> undefined,
// guard false), and non-object values fail the earlier typeof gate.
type RouteMapping = { hostname: string; port: number; pid: number };
function isValidRoute(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as RouteMapping).hostname === "string" &&
    typeof (value as RouteMapping).port === "number" &&
    typeof (value as RouteMapping).pid === "number"
  );
}
console.log(isValidRoute(JSON.parse('{"hostname":"a","port":1,"pid":2}')));
console.log(isValidRoute(JSON.parse('{"hostname":"a","port":"x","pid":2}')));
console.log(isValidRoute(JSON.parse('{"hostname":"a","port":1}')));
console.log(isValidRoute(JSON.parse('"str"')));
console.log(isValidRoute(JSON.parse("null")));
console.log(isValidRoute(JSON.parse("[1,2]")));
console.log("done");
