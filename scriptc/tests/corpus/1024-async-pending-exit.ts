// A promise nobody resolves: Node exits 0 when the loop drains even with
// suspended awaits (the classic gotcha) — matched exactly.
async function waitsForever(): Promise<void> {
  console.log("suspending");
  await new Promise<void>(() => {});
  console.log("never resumes");
}
waitsForever();
console.log("main done");
