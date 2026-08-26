// some/every/find/findIndex take the ToBoolean of the predicate's result
// wherever that ToBoolean has a static answer: f64/string by value, an
// undefined-armed union by its arm — the `packages.some((p) => p.scripts[name])`
// idiom's shape.
interface WorkspacePackage { name: string; dev?: string; build?: string }
const packages: WorkspacePackage[] = [
  { name: "a", build: "tsc" },
  { name: "b", dev: "vite" },
];
console.log(packages.some((p) => p.dev));
console.log(packages.some((p) => p.build));
console.log(packages.every((p) => p.dev));
console.log(packages.findIndex((p) => p.dev));
const hit = packages.find((p) => p.dev);
console.log(hit ? hit.name : "none");
console.log([0, 1, 2].some((n) => n));
console.log(["", "", "x"].findIndex((s) => s));
console.log([0, 0].every((n) => n * 2));
