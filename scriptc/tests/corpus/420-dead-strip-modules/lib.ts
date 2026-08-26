// A library with used exports AND unused corners the static compiler
// rejects: reachability keeps the corners out of the build entirely, so
// importing this module cannot fail on code nothing runs. Node is the
// oracle for everything the entry DOES run.

// Reached through used(): a mutually recursive pair (worklist convergence).
export function used(n: number): number {
  return evenSteps(n) + 1;
}
function evenSteps(n: number): number {
  return n <= 0 ? 0 : oddSteps(n - 1);
}
function oddSteps(n: number): number {
  return n <= 0 ? 1 : evenSteps(n - 1);
}

// Referenced ONLY as a closure (never called directly by name): a taken
// closure may be called indirectly, so its body is reachable.
export function double(n: number): number {
  return n * 2;
}
export function pick(f: (n: number) => number, n: number): number {
  return f(n);
}

// UNREACHED corners. Each contains something the compiler rejects when it
// lowers — none of these may fail the build or leave a trace in the C.
export function unusedForIn(g: Gadget): void {
  // for-in over a CLASS INSTANCE is the fenced receiver kind (records and
  // arrays enumerate now).
  for (const k in g) {
    console.log(k);
  }
}
export async function unusedAsync(): Promise<number> {
  return 5;
}
export function unusedComptime(): number {
  // comptime bakes at lowering: unreached means never lowered, so this
  // throw can never happen at COMPILE time (and Node never calls it).
  return comptime((): number => {
    throw "never evaluated";
  });
}
// An unused generic costs nothing (no instantiation, no instance bodies).
export function unusedGeneric<T>(x: T): T {
  return x;
}

// A class whose members split: tag accessors and usedMethod are reached;
// unusedMethod (with a rejected construct inside) never lowers.
export class Gadget {
  label: string = "g";
  get tag(): string {
    return this.label;
  }
  set tag(v: string) {
    this.label = v;
  }
  usedMethod(): number {
    return this.label.length;
  }
  unusedMethod(): void {
    for (const k in this) {
      console.log(k);
    }
  }
}
