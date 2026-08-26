export interface Point {
  x: number;
  y: number;
}
export function makePoint(x: number, y: number): Point {
  return { x, y };
}
export let made: number = 0;
export function noteMade(): void {
  made += 1;
}
