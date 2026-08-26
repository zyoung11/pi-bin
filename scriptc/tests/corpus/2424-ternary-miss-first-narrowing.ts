// Miss-first ternary null/undefined guards narrow the ELSE arm, in both operand orders (x === undefined ? miss : hit, undefined === x too); find misses with undefined.
interface Task { readonly id: number; }
function firstOrMinus(tasks: readonly Task[], id: number): number {
  const found = tasks.find((t) => t.id === id);
  return found === undefined ? -1 : found.id + 1;
}
function flipped(tasks: readonly Task[], id: number): number {
  const found = tasks.find((t) => t.id === id);
  return undefined === found ? -1 : found.id + 1;
}
function selPlus(sel: number | null): number {
  return sel === null ? 0 : sel + 1;
}
const tasks: Task[] = [{ id: 3 }, { id: 7 }];
console.log(firstOrMinus(tasks, 7));
console.log(firstOrMinus(tasks, 9));
console.log(flipped(tasks, 3));
console.log(flipped(tasks, 9));
console.log(selPlus(41));
console.log(selPlus(null));
