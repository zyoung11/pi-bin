// Class values keep identity and .name across modules; construction and
// statics through imported values are the local story exactly.
import { Shape, Hexagon, registry, DefaultShape } from "./lib.ts";

console.log(DefaultShape === Hexagon, DefaultShape === (Shape as typeof Shape));
console.log(DefaultShape.name, Shape.name);
const h = new DefaultShape();
console.log(h.label(), h.sides, h instanceof Shape, h instanceof Hexagon);
console.log(DefaultShape.family, Hexagon.family);
for (const K of registry) {
  console.log(K.name, new K().label(), K === Hexagon);
}
