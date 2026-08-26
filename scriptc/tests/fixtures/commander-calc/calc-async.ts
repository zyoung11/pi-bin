// The classic CLI ENTRY LINE, end-to-end: `parseAsync(process.argv)` returns
// the ENGINE's promise, the island → static promise bridge settles a
// static one from it, and the inline `.catch` handler is the desugared
// typed-catch — a rejecting async action reaches the handler (instanceof
// narrows the bridged Error), the message goes to stderr, and the process
// exits 1. Byte-compared against Node across the argv fixtures.
import { Command } from "commander";

const program = new Command();

program.name("calc-async").description("the parseAsync acceptance CLI").version("1.0.0");

program
  .command("double <n>")
  .description("double a number, asynchronously")
  .action(async (n: string) => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 1);
    });
    console.log(parseFloat(n) * 2);
  });

program
  .command("fail <reason>")
  .description("reject asynchronously with the given reason")
  .action(async (reason: string) => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 1);
    });
    throw new Error(`cannot compute: ${reason}`);
  });

// Verbatim real-CLI entry shape.
program.parseAsync(process.argv).catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Error: ${msg}\n`);
  process.exit(1);
});
