// comptime feeding module globals: the baked values are ordinary file-scope
// consts — exported, imported, and read across the module graph.
export const CUBES: number[] = comptime(() => {
  const t: number[] = [];
  for (let i = 1; i <= 10; i++) {
    t.push(i * i * i);
  }
  return t;
});

export const LABEL = comptime(() => "cubes" + "!".repeat(2));

export function lookup(i: number): number {
  return CUBES[i];
}
