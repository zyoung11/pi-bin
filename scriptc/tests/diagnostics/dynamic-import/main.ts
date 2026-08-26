// @dynamic
// Dynamic import() fences under --dynamic: non-literal specifiers (the
// module graph is a build-time artifact) and builtins the island has no
// shim for. The program's own compiled modules are NOT fenced anymore —
// `import("./helper.js")` resolves to the compiled module's exports
// marshaled into the engine (lowerOwnModuleImport). A specifier that
// resolves to NO types at all is tsc's TS2307 at preflight, before any
// of these.
import { tag } from "./helper.js";

async function run(): Promise<void> {
  const name = "greeter" + tag();
  await import(name);
  await import("./helper.js");
  await import("http2");
}
run();
