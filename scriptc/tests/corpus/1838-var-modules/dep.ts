// Exported `var`: a mutable module global with live bindings — importers
// see every reassignment, exactly like `export let`.
export var counter = 0;
export function bump(): void {
  counter++;
}
