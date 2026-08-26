// Exported classes and a registry of class VALUES crossing module lines.
export class Shape {
  sides = 0;
  constructor() {}
  label(): string {
    return "shape";
  }
  static family = "geometry";
}
export class Hexagon extends Shape {
  constructor() {
    super();
    this.sides = 6;
  }
  label(): string {
    return "hexagon";
  }
}
export const registry: (typeof Shape)[] = [Hexagon, Shape];
export const DefaultShape = Hexagon;
