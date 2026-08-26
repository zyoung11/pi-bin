// Parameter defaults on FUNC-typed and SET-typed parameters: the synthesized
// ABI union's only test is the prologue's own undefined-tag check, so these
// arm like any ref kind — the tailscale/service `runner: Runner =
// defaultRunner` and `skip: Set<string> = new Set()` idioms.
interface RunResult {
  error: string | undefined;
  status: number | null;
  stderr: string;
  stdout: string;
}
type Runner = (args: string[]) => RunResult;

const defaultRunner: Runner = (args): RunResult => ({
  error: undefined,
  status: 0,
  stderr: "",
  stdout: "ran:" + args.join(" "),
});

function run(args: string[], runner: Runner = defaultRunner): string {
  const result = runner(args);
  if (result.error !== undefined || result.status !== 0) return "failed:" + result.stderr;
  return result.stdout;
}

console.log(run(["serve", "status", "--json"]));
console.log(run(["up"], (args): RunResult => ({ error: undefined, status: 1, stderr: "denied " + args.length, stdout: "" })));
console.log(run(["down"], undefined)); // explicit undefined takes the default, JS-exact

function collect(names: string[], skip: Set<string> = new Set(["b"])): string[] {
  return names.filter((n) => !skip.has(n));
}
console.log(collect(["a", "b", "c"]).join(","));
console.log(collect(["a", "b", "c"], new Set(["a", "c"])).join(","));
console.log(collect(["a", "b"], undefined).join(","));
console.log(collect(["a", "b"], new Set()).join(","));

// The default expression evaluates per omitted CALL (a fresh Set each time),
// and only when the argument is absent/undefined.
let made = 0;
function fresh(): Set<string> {
  made++;
  return new Set(["seen"]);
}
function mark(name: string, seen: Set<string> = fresh()): number {
  seen.add(name);
  return seen.size;
}
console.log(mark("x"), mark("x"), made);
const shared = new Set<string>(["a"]);
console.log(mark("x", shared), mark("y", shared), made);
