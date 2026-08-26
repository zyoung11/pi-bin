// A NAMED default function declaration: hoisted, recursive through its
// local name, and the module's default binding all at once.
export default function double(n: number): number {
  return n < 1 ? 0 : 2 + double(n - 1);
}
export const label = "double";
