// Optional chaining: property, method, call, and element forms on
// T | undefined and T | null receivers — nullish receivers yield undefined
// (even null ones), everything else lowers like the plain spelling, and
// neither the member nor the arguments evaluate on the short-circuit path.

function maybeStr(n: number): string | undefined {
  return n > 0 ? "  padded  " : undefined;
}

// string method through ?.
console.log(maybeStr(1)?.trim() ?? "gone");
console.log(maybeStr(-1)?.trim() ?? "gone");

// string property through ?.
function maybeWord(yes: boolean): string | undefined {
  return yes ? "abcde" : undefined;
}
console.log(maybeWord(true)?.length ?? -1);
console.log(maybeWord(false)?.length ?? -1);

// a NULL receiver still yields undefined, JS-exact
function nullableStr(yes: boolean): string | null {
  return yes ? " x " : null;
}
console.log(nullableStr(false)?.length === undefined);
console.log(nullableStr(false)?.trim() ?? "was-null");
console.log(nullableStr(true)?.trim() ?? "was-null");

// record fields
interface Person {
  name: string;
  nick?: string;
}
function findPerson(id: number): Person | undefined {
  if (id === 1) {
    const p: Person = { name: "ada" };
    return p;
  }
  if (id === 2) {
    const p: Person = { name: "grace", nick: "g" };
    return p;
  }
  return undefined;
}
console.log(findPerson(1)?.name ?? "?");
console.log(findPerson(3)?.name ?? "?");
// optional field through the chain: both undefineds collapse
console.log(findPerson(1)?.nick ?? "no-nick");
console.log(findPerson(2)?.nick ?? "no-nick");
console.log(findPerson(3)?.nick ?? "no-nick");

// class methods and fields
class Greeter {
  who: string;
  constructor(who: string) {
    this.who = who;
  }
  greet(): string {
    return "hi " + this.who;
  }
  poke(): void {
    console.log("poked", this.who);
  }
}
function maybeGreeter(yes: boolean): Greeter | undefined {
  return yes ? new Greeter("ada") : undefined;
}
console.log(maybeGreeter(true)?.greet() ?? "nobody");
console.log(maybeGreeter(false)?.greet() ?? "nobody");
console.log(maybeGreeter(true)?.who ?? "?");
// void method in statement position: runs or silently skips
maybeGreeter(true)?.poke();
maybeGreeter(false)?.poke();

// nullable callbacks — the (() => void) | null shape
function pickCleanup(yes: boolean): (() => void) | null {
  return yes ? () => console.log("cleanup ran") : null;
}
const noCleanup = pickCleanup(false);
noCleanup?.();
console.log("skipped null cleanup");
const someCleanup = pickCleanup(true);
someCleanup?.();

// callbacks with arguments: args do NOT evaluate on the nullish path
let evals = 0;
function tick(): number {
  evals = evals + 1;
  return evals;
}
function pickSink(yes: boolean): ((n: number) => void) | undefined {
  return yes ? (n) => console.log("got", n) : undefined;
}
const noSink = pickSink(false);
noSink?.(tick());
console.log("evals after skipped call:", evals);
const sink = pickSink(true);
sink?.(tick());
console.log("evals after taken call:", evals);

// value-form nullable callback: result rides the undefined union
function pickSupply(yes: boolean): (() => number) | null {
  return yes ? () => 42 : null;
}
console.log(pickSupply(true)?.() ?? -1);
console.log(pickSupply(false)?.() ?? -1);

// record field holding a nullable callback
interface Task {
  label: string;
  onDone: (() => void) | null;
}
const t1: Task = { label: "a", onDone: () => console.log("done a") };
const t2: Task = { label: "b", onDone: pickCleanup(false) };
t1.onDone?.();
t2.onDone?.();
console.log("tasks dispatched");

// ?? on the nullable-callback shape picks the fallback closure
const fallback = (): number => 7;
const chosen = pickSupply(false) ?? fallback;
console.log(chosen());

// element access through ?.
function maybeArr(yes: boolean): number[] | undefined {
  return yes ? [10, 20, 30] : undefined;
}
console.log(maybeArr(true)?.[1] ?? -1);
console.log(maybeArr(false)?.[1] ?? -1);
console.log(maybeArr(true)?.length ?? -1);

// ?. on a receiver the checker knows is never nullish folds to plain .
const plain = "solid";
console.log(plain?.length, plain?.charAt(0));
