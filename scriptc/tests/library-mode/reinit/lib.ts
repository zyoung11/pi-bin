// K4 fixture: init re-run determinism. Module state (a scalar, a
// refcounted array, the run-once module guards) fully resets between
// sessions — two init calls produce identical observable outputs, and
// under the sanitize flavor the reset seam asserts zero live heap between
// sessions (the library RC-audit counters).
let counter = 0;
const seen: string[] = [];

export function bump(): number {
  counter = counter + 1;
  return counter;
}

export function note(s: string): number {
  seen.push(s);
  return seen.length;
}

export function recall(): string {
  return seen.join(",");
}

console.log(`session start counter=${counter}`);
