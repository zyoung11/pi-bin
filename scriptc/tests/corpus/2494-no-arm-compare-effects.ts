// The no-arm unit comparison still EVALUATES its operand: `xs.find(probe) === null` runs the probe callbacks (JS evaluates both sides of ===), the answer is the constant, and `??` on `T | undefined` / `T | null` takes the default on exactly its own unit arms.
let calls = 0;
const xs = [1, 2, 3];
const probe = (x: number): boolean => {
  calls++;
  return x > 10;
};
console.log(xs.find(probe) === null);
console.log(calls);
console.log(xs.find(probe) !== null);
console.log(calls);
console.log(null === xs.find(probe));
console.log(calls);
function pick(): number | undefined {
  calls += 100;
  return undefined;
}
console.log(pick() === null, calls);
console.log(pick() ?? -1);
function pickNull(): string | null {
  calls += 1000;
  return null;
}
console.log(pickNull() === undefined, calls);
console.log(pickNull() ?? "fallback");
console.log(calls);
