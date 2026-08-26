// Keyed reads on the dyn (a JSON.parse result): dot and bracket forms,
// `in` presence tests, optional-chain steps (unit receivers answer
// undefined), array/string `length`, canonical array indices, the
// dyn-or-unit ternary join (`typeof pkg.name === "string" ? pkg.name : null`),
// and the JS TypeError on non-optional undefined receivers.
const pkg = JSON.parse(
  '{ "name": "@scope/myapp", "portless": { "port": 3000 }, "scripts": { "dev": "next dev" }, "workspaces": { "packages": ["a", "b"] }, "list": [10, 20, 30], "label": "héllo" }',
);

if (typeof pkg.name === "string" && pkg.name) {
  console.log("name is string");
}
console.log("missing is undefined:", pkg.missing === undefined);

if (pkg && typeof pkg === "object" && "portless" in pkg) {
  console.log("has portless");
}
console.log("has nope:", pkg && typeof pkg === "object" && "nope" in pkg ? "yes" : "no");
console.log("list is array:", pkg && typeof pkg === "object" && Array.isArray(pkg.list) ? "yes" : "no");

const scriptName = "dev";
console.log("script dev:", typeof pkg?.scripts?.[scriptName] === "string" ? "yes" : "no");
console.log("script missing:", typeof pkg?.scripts?.["nope"] === "string" ? "yes" : "no");
console.log("chain into missing:", pkg?.missing?.deeper === undefined);

function wsIsObject(): void {
  const ws = pkg.workspaces;
  if (ws && typeof ws === "object") {
    console.log("ws is object");
  }
}
wsIsObject();
console.log("packages[0] string:", typeof pkg.workspaces.packages["0"] === "string");
console.log("packages[9]:", pkg.workspaces.packages["9"] === undefined);
console.log("list len 3:", typeof pkg.list.length === "number" && (pkg.list.length as number) === 3);
console.log("label len:", pkg.label.length as number);

function ternaryJoins(): void {
  const rawName = typeof pkg.name === "string" ? pkg.name : null;
  console.log("rawName string:", typeof rawName === "string" ? (rawName as string) : "(none)");
  const scripts = typeof pkg.scripts === "object" && pkg.scripts !== null ? pkg.scripts : {};
  console.log("scripts kept:", typeof scripts === "object");
  const fallback = typeof pkg.nope === "object" && pkg.nope !== null ? pkg.nope : {};
  console.log("fallback empty:", typeof fallback === "object");
}
ternaryJoins();

try {
  const deep = pkg.missing.deep;
  console.log("unreachable", deep === undefined);
} catch (e) {
  console.log("caught:", e instanceof TypeError, (e as Error).message);
}
