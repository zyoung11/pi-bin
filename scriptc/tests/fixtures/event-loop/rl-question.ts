// The portless prompt shape, twice: each prompt makes a fresh interface,
// registers a close listener, asks, and the ANSWER path closes the
// interface — whose synchronous 'close' emit resolves the promise FIRST
// (Node's inline close, oracle-pinned: the answer resolve is a no-op).
import * as readline from "node:readline";

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.on("close", () => {
      resolve("(close won)");
    });
    rl.question(question, (answer) => {
      console.log("cb:", JSON.stringify(answer));
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main(): Promise<void> {
  const a = await prompt("First? ");
  console.log("a:", JSON.stringify(a));
  const b = await prompt("Second? ");
  console.log("b:", JSON.stringify(b));
  console.log("done");
}
main();
