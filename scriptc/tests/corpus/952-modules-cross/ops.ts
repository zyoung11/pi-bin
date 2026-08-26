import { makePoint, made, noteMade } from "./shapes.ts";
import type { Point } from "./shapes.ts";
let history: string = "";
export function shift(p: Point, by: number): Point {
  noteMade();
  history += `(${p.x}+${by})`;
  return makePoint(p.x + by, p.y + by);
}
export function madeCount(): number {
  return made;
}
const stashedPoint = makePoint(100, 200);
export const stashed = (): string => `${stashedPoint.x},${stashedPoint.y}:${history}`;
