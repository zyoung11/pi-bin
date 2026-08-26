// RC/cycle torture for error objects: churn plain errors and subclasses in
// loops, thread them through catches and rethrows, store closures ON
// errors that capture the error itself (a cycle through the traced Error
// hierarchy — collected, not leaked; the SAN lane asserts a clean audit).
class TaskError extends Error {
  attempt: number;
  retry: () => string = () => "unset";
  constructor(attempt: number) {
    super(`attempt ${attempt}`);
    this.name = "TaskError";
    this.attempt = attempt;
  }
}

let sum = 0;
for (let i = 0; i < 200; i = i + 1) {
  const e = new Error(`plain ${i}`);
  sum = sum + e.message.length;
}
console.log("plain churn", sum);

// Cycles: the closure stored on the error captures the error.
let calls = 0;
for (let i = 0; i < 100; i = i + 1) {
  const t = new TaskError(i);
  t.retry = () => {
    return `retrying ${t.message}`;
  };
  if (i % 40 === 0) {
    const f = t.retry;
    console.log(f());
    calls = calls + 1;
  }
}
console.log("cycle churn", calls);

// Thrown errors through catch/rethrow chains release cleanly.
function hop(depth: number): number {
  if (depth === 0) throw new TaskError(depth);
  try {
    return hop(depth - 1);
  } catch (e) {
    if (e instanceof TaskError && depth < 3) {
      throw e; // rethrow: same object, another frame
    }
    if (e instanceof TaskError) {
      return e.attempt + depth;
    }
    throw e;
  }
}
let total = 0;
for (let i = 0; i < 50; i = i + 1) {
  total = total + hop(5);
}
console.log("hops", total);

// Errors captured into arrays-of-messages (extraction under narrows).
const texts: string[] = [];
for (let i = 0; i < 30; i = i + 1) {
  try {
    throw new TaskError(i);
  } catch (e) {
    if (e instanceof Error) texts.push(e.toString());
  }
}
console.log(texts.length, texts[0], texts[29]);
