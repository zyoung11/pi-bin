export class Point {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  norm(): number {
    return (this.x < 0 ? -this.x : this.x) + (this.y < 0 ? -this.y : this.y);
  }
}
export enum Axis {
  X = 1,
  Y = 2,
}
export function origin(): Point {
  return new Point(0, 0);
}
export const SCALE = 10;
export let hits = 0;
export function record(): void {
  hits += 1;
}
export default "geo-v1";
