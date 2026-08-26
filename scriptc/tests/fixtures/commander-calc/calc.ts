// The npm acceptance CLI: a calculator built on the REAL commander package
// (vendored under this fixture's node_modules), compiled with --dynamic and
// byte-compared against Node across argv fixtures — including --version and
// --help (island process.exit) and the error paths (exit code 1).
import { Command } from "commander";

const program = new Command();

program.name("calc").description("A tiny calculator CLI").version("1.0.0");

program
  .command("add <a> <b>")
  .description("add two numbers")
  .action((a, b) => {
    console.log(parseFloat(a) + parseFloat(b));
  });

program
  .command("sub <a> <b>")
  .description("subtract b from a")
  .action((a, b) => {
    console.log(parseFloat(a) - parseFloat(b));
  });

program
  .command("mul <a> <b>")
  .description("multiply two numbers")
  .action((a, b) => {
    console.log(parseFloat(a) * parseFloat(b));
  });

program
  .command("div <a> <b>")
  .description("divide a by b")
  .action((a, b) => {
    console.log(parseFloat(a) / parseFloat(b));
  });

// The TYPED-callback boundary (the real-CLI `.action` shape): declared param
// types on a callback crossing into the island — the optional command
// argument arrives as `string | undefined` (the undefined arm when
// omitted), commander's options object converts to a static record at
// call time (missing options take the optional fields' undefined arms),
// the trailing Command argument drops (declared arity), and the async
// body's promise wraps as a real engine thenable.
interface EchoOptions {
  upper?: boolean;
  prefix?: string;
}

program
  .command("echo [text]")
  .description("echo text through an async typed action")
  .option("-u, --upper", "uppercase the output")
  .option("-p, --prefix <prefix>", "prefix the output")
  .action(async (rawText: string | undefined, opts: EchoOptions) => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 1);
    });
    const text = rawText !== undefined ? rawText : "(silence)";
    const prefixed = opts.prefix !== undefined ? opts.prefix + text : text;
    const upper = opts.upper !== undefined && opts.upper;
    console.log(upper ? prefixed.toUpperCase() : prefixed);
  });

// A rejecting ASYNC action under plain parse(): the action's rejection is
// nobody's to observe (parse() returns synchronously), so it lands in the
// unhandled-rejection report and the process exits 1 — Node-exact exit
// code, one-line stderr (not byte-compared). The a real CLI entry spelling —
// `parseAsync(process.argv).catch(handler)` — rides the island → static
// promise bridge and is exercised end-to-end by calc-async.ts.
program
  .command("fail <reason>")
  .description("reject asynchronously with the given reason")
  .action(async (reason: string) => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 1);
    });
    throw new Error(`cannot compute: ${reason}`);
  });

program.parse();
