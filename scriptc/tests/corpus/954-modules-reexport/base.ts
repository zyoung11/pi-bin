// The origin module: a mutable export (live-binding check through the
// re-export hops) and side-effecting init.
console.log("base init");

export let counter = 0;

export function inc(): void {
  counter = counter + 1;
}

export function greet(name: string): string {
  return `hi ${name}`;
}
