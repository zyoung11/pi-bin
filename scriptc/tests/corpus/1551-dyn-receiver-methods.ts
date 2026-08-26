// METHOD calls on dyn (JSON.parse-derived) receivers: validate the
// receiver's dyn kind, extract, ride the static machinery — trust-but-verify
// extended to receivers. Wrong-kind receivers throw V8's own catchable
// TypeErrors, message-exact for these forms.
function baseName(raw: string): string {
  const pkg = JSON.parse(raw);
  if (typeof pkg.name === "string" && pkg.name) {
    return pkg.name.replace(/^@[^/]+\//, "");
  }
  return "app";
}
console.log(baseName('{"name":"@scope/pkg"}'));
console.log(baseName('{"name":"plain"}'));
console.log(baseName('{"nope":1}'));

// The dyn-local receiver form (`pm.split("@")`) — the result is a real
// static string[], consumable through an annotated slot.
function managerOf(raw: string): string {
  const pkg = JSON.parse(raw);
  const pm = pkg.packageManager;
  if (!pm) return "none";
  const parts: string[] = pm.split("@");
  return parts[0] === "pnpm" || parts[0] === "yarn" ? parts[0] : "other";
}
console.log(managerOf('{"packageManager":"pnpm@9.0.0"}'));
console.log(managerOf('{"packageManager":"npm@10"}'));
console.log(managerOf('{}'));

// More string-only methods ride the same validated receiver.
const cfg = JSON.parse('{"host":"  API.Example.COM  ","ports":"80/443/8080"}');
const trimmed: string = cfg.host.trim();
console.log(trimmed.toLowerCase());
console.log(cfg.host.trim().toLowerCase());
const portList: string[] = cfg.ports.split("/");
console.log(portList.join(","), portList.length);

// `.filter` on dyn arrays: the predicate runs over the dyn elements, the
// survivors validated-extract into the element type the checker committed
// the result to (the workspaces idiom, object form included).
function globsOf(raw: string): string[] | null {
  const pkg = JSON.parse(raw);
  if (!pkg || typeof pkg !== "object") return null;
  const ws = pkg.workspaces;
  if (Array.isArray(ws)) {
    return ws.filter((g: unknown) => typeof g === "string");
  }
  if (ws && typeof ws === "object" && !Array.isArray(ws) && Array.isArray(ws.packages)) {
    return ws.packages.filter((g: unknown) => typeof g === "string");
  }
  return null;
}
console.log(JSON.stringify(globsOf('{"workspaces":["apps/*",1,"packages/*"]}')));
console.log(JSON.stringify(globsOf('{"workspaces":{"packages":["x","y",false]}}')));
console.log(JSON.stringify(globsOf('{"workspaces":"nope"}')));
console.log(JSON.stringify(globsOf("null")));

// The callback sees the index when it declares it, and number elements
// extract like string ones.
const nums = JSON.parse('[10,"skip",20,30,40]');
const firstThree: number[] = nums.filter((n: unknown, i: number) => typeof n === "number" && i < 3);
console.log(firstThree.join("+"));

// Wrong-kind receivers throw V8's catchable TypeErrors, message-exact:
// nullish receivers fail the property read, other kinds fail the call.
const bad = JSON.parse('{"count":7,"list":[1]}');
try {
  bad.count.replace(/x/, "y");
} catch (e) {
  console.log((e as Error).message);
}
try {
  bad.missing.split(",");
} catch (e) {
  console.log((e as Error).message);
}
try {
  bad.list.trim();
} catch (e) {
  console.log((e as Error).message);
}
try {
  const junk: number[] = bad.count.filter((v: unknown) => typeof v === "number");
  console.log(junk.length);
} catch (e) {
  console.log((e as Error).message);
}
