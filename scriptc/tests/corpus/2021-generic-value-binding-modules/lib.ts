// Exported generic value bindings: ESM import bindings are read-only, so
// the never-reassigned analysis stays sound across files — importers'
// calls and pinned references monomorphize against these initializers.
export const pick = <T>(xs: T[], i: number): T => xs[i]!;
export const label = function mark<T>(x: T): string {
  return `[${x}:${mark2(x)}]`;
};
// Inner helper: a non-exported generic binding used by an exported one.
const mark2 = <T>(x: T): string => typeof x;
export namespace Util {
  export const twice = <T>(x: T): T[] => [x, x];
}
