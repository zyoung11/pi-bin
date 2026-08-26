// Structural width subtyping: a record (or record array) flowing into a
// strict field-subset slot reshapes by copying the subset of fields.
// Everything here is read-after-narrow, where the copy is observationally
// identical to Node's aliasing (the divergence is SEMANTICS.md 35).
type ModelEntry = {
  id: string;
  name: string;
  released: number;
};

const models: ModelEntry[] = [
  { id: "m1", name: "One", released: 2024 },
  { id: "m2", name: "Two", released: 2025 },
];

// Array-into-array slot flow (the Pick display-table pattern).
function listIds(entries: { id: string }[]): string {
  const ids: string[] = [];
  for (const e of entries) ids.push(e.id);
  return ids.join(",");
}
console.log(listIds(models));

// Single-record width flow, direct argument and initializer.
function describe(m: { id: string; released: number }): string {
  return `${m.id}@${m.released}`;
}
console.log(describe(models[0]!));
const narrowed: { name: string } = models[1]!;
console.log(narrowed.name);

// Union slots: the coerced value wraps into the matching arm.
function maybeIds(entries?: { id: string }[]): number {
  if (entries === undefined) return -1;
  return entries.length;
}
console.log(maybeIds(models), maybeIds(undefined));
function oneOrNothing(m: { id: string } | undefined): string {
  return m === undefined ? "none" : m.id;
}
console.log(oneOrNothing(models[0]), oneOrNothing(undefined));

// Fields with union types copy exactly (same field type, no re-tag).
type Task = { id: string; note: string | undefined; extra: number };
const tasks: Task[] = [
  { id: "t1", note: "hello", extra: 7 },
  { id: "t2", note: undefined, extra: 8 },
];
function notes(xs: { id: string; note: string | undefined }[]): void {
  for (const t of xs) {
    console.log(t.id, t.note === undefined ? "-" : t.note);
  }
}
notes(tasks);

// Returns flow through the same slot coercion.
function firstNarrow(xs: ModelEntry[]): { id: string } {
  return xs[0]!;
}
console.log(firstNarrow(models).id);

// Empty arrays reshape to empty arrays.
const none: ModelEntry[] = [];
console.log(listIds(none), maybeIds(none));
