// child_process support boundaries: what stays rejected at LOWERING with
// specific messages. The fallback declarations type the supported surface
// exactly, so most misuse is a type error before lowering; these are the
// forms that TYPECHECK and fence per site.

import { spawn } from "node:child_process";

// Node's default stdio is "pipe" (streams — no lowering): omitting the
// options never silently loses the child's output.
const noOpts = spawn("/bin/echo");

// "pipe" and "inherit" typecheck against the declared union but have no
// lowering — each names its gap.
const piped = spawn("/bin/echo", [], { stdio: "pipe" });
const inherited = spawn("/bin/echo", [], { stdio: "inherit" });

const c = spawn("true", [], { stdio: "ignore" });

// `() => 5` IS assignable to a void-returning listener slot and now ADOPTS
// the slot's void (JS ignores the value); an ANNOTATED value-returning
// listener keeps its word and stays fenced — the registry calls listeners
// as void.
c.on("exit", (): number => 5);

// Methods have no bound-value form — call on directly.
const f = c.on;
