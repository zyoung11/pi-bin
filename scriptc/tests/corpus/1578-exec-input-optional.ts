// execFileSync input as string | undefined — Node's exact member reading:
// the undefined arm means the option is ABSENT (no stdin piping), distinct
// from "" (pipe EMPTY stdin — the child reads immediate EOF). The child-
// visible contract: absent/undefined/"" all read nothing, text feeds
// through; the openssl-runner idiom passes `options?.input` verbatim.
import { execFileSync } from "node:child_process";

function run(args: string[], options?: { input?: string }): string {
  return execFileSync("cat", args, {
    encoding: "utf-8",
    input: options?.input,
    stdio: ["pipe", "pipe", "pipe"],
  });
}
console.log("absent:", JSON.stringify(run([])));
console.log("empty-member:", JSON.stringify(run([], {})));
console.log("empty:", JSON.stringify(run([], { input: "" })));
console.log("text:", JSON.stringify(run([], { input: "piped text\n" })));

// The literal member forms: undefined, "", and text.
console.log(JSON.stringify(execFileSync("cat", [], { encoding: "utf8", input: undefined })));
console.log(JSON.stringify(execFileSync("cat", [], { encoding: "utf8", input: "" })));
console.log(JSON.stringify(execFileSync("cat", [], { encoding: "utf8", input: "abc" })));

// A definitely-string variable stays the plain path.
const definite: string = "sure\n";
console.log(JSON.stringify(execFileSync("cat", [], { encoding: "utf8", input: definite })));

// The optional chain composes with execSync (the shell form) too.
const maybe: { input?: string } | undefined = { input: "via shell\n" };
console.log(JSON.stringify(execSyncEcho(maybe)));
console.log(JSON.stringify(execSyncEcho(undefined)));
import { execSync } from "node:child_process";
function execSyncEcho(options?: { input?: string }): string {
  return execSync("cat", { encoding: "utf8", input: options?.input });
}
