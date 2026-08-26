export function identity<T>(x: T): T {
  return x;
}

export function lastOf<T>(a: T[]): T {
  return a[a.length - 1];
}

// The exporter instantiates its own generic too — the importer's
// same-typed calls must share these instances, not duplicate them.
export const localUse: string = identity("exporter");
console.log("util init", identity(1), lastOf([2, 4, 8]));
