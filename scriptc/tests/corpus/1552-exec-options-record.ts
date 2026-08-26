// ExecFileSyncOptionsWithStringEncoding is a real record: a typed options
// const (or a runner function's options PARAMETER) flows to execFileSync at
// runtime — the windows-ca command-runner idiom. cwd/input/timeout read
// their fields (undefined takes the literal path's default), the stdio
// modes compute at runtime, and optional FUNCTION-typed record fields
// (run?: Runner) resolve through `??` like any nullable callback.
import { execFileSync, type ExecFileSyncOptionsWithStringEncoding } from "node:child_process";

type Runner = (command: string, args: string[], options: ExecFileSyncOptionsWithStringEncoding) => string;

const commandOptions: ExecFileSyncOptionsWithStringEncoding = {
  encoding: "utf-8",
  timeout: 30_000,
  stdio: ["pipe", "pipe", "pipe"],
};

const defaultRunner: Runner = (command, args, options): string =>
  execFileSync(command, args, options);

type StoreOptions = {
  command?: string;
  certificatePath?: (certificatePath: string) => string;
  run?: Runner;
};

function storeOptions(options: StoreOptions): {
  command: string;
  certificatePath: (certificatePath: string) => string;
  run: Runner;
} {
  return {
    command: options.command ?? "/bin/echo",
    certificatePath: options.certificatePath ?? ((certificatePath) => certificatePath),
    run: options.run ?? defaultRunner,
  };
}

function listStore(options: StoreOptions = {}): string {
  const resolved = storeOptions(options);
  return resolved.run(resolved.command, ["-store", "-user", "Root"], commandOptions).trim();
}

console.log(listStore());
console.log(listStore({ command: "/bin/echo" }));
console.log(listStore({ run: (c, a, o) => `ran:${c}:${a.join("|")}:${o.encoding}:${o.timeout}` }));
console.log(storeOptions({ certificatePath: (p) => "C:\\certs\\" + p }).certificatePath("ca.pem"));
console.log(storeOptions({}).certificatePath("ca.pem"));

// Runtime member defaults: an options value with only the required
// encoding — cwd/input/timeout/stdio all take the literal path's defaults.
const bare: ExecFileSyncOptionsWithStringEncoding = { encoding: "utf8" };
console.log(execFileSync("/usr/bin/printf", ["%s-%s", "a", "b"], bare));

// input and cwd read their runtime fields. input goes only to a child
// that READS stdin: feeding it to pwd races the child's exit against the
// stdin write in Node itself (EPIPE truncates the oracle's output ~1/8
// runs — measured), so cwd gets its own input-less record.
const fed: ExecFileSyncOptionsWithStringEncoding = { encoding: "utf8", input: "hi there", cwd: "/" };
console.log(execFileSync("/bin/cat", [], fed));
const at: ExecFileSyncOptionsWithStringEncoding = { encoding: "utf8", cwd: "/" };
console.log(execFileSync("/bin/pwd", [], at).trim());

// A runtime single-string stdio applies to all three fds.
const quiet: ExecFileSyncOptionsWithStringEncoding = { encoding: "utf8", stdio: "pipe" };
console.log(execFileSync("/usr/bin/printf", ["quiet-ok"], quiet));
