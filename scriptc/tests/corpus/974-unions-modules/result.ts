// A union type exported across modules: the importer's structurally
// identical uses share one tagged representation (whole-program interning),
// and a union-typed module global is a live binding.
export type Outcome = { tag: "hit"; score: number } | { tag: "miss"; reason: string };

export function attempt(n: number): Outcome {
  if (n % 3 === 0) {
    return { tag: "miss", reason: `n=${n} divisible by 3` };
  }
  return { tag: "hit", score: n * 10 };
}

export function describe(o: Outcome): string {
  if (o.tag === "hit") {
    return `hit:${o.score}`;
  }
  return `miss(${o.reason})`;
}

// Live-binding union global: mutated by the exporter, observed by the
// importer (and released at process exit like any refcounted global).
export let last: Outcome = { tag: "miss", reason: "not started" };

export function record(n: number): void {
  last = attempt(n);
}

console.log("result init", describe(last));
