// Refcounted values held across suspension points; async arrows capturing
// state; churn under the sanitized lane.
interface Job { name: string; payload: string[] }
function later<T>(v: T, ms: number): Promise<T> {
  return new Promise<T>((resolve) => {
    setTimeout(() => {
      resolve(v);
    }, ms);
  });
}
async function process2(job: Job): Promise<string> {
  const header = `[${job.name}]`;
  const enriched = await later(job.payload.map((p) => header + p), 5);
  const tail = await later(`(${enriched.length})`, 5);
  return enriched.join("+") + tail;
}
let counter = 0;
const bump = async (by: number): Promise<number> => {
  counter += by;
  const seen = await later(counter, 5);
  return seen * 10;
};
async function main2(): Promise<void> {
  const out: string[] = [];
  out.push(await process2({ name: "a", payload: ["x", "y"] }));
  out.push(await process2({ name: "b", payload: ["z"] }));
  console.log(out.join(" | "));
  console.log(await bump(2), await bump(3), counter);
}
main2();
