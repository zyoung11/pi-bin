import { madeCount, shift, stashed } from "./ops.ts";
import { made, makePoint } from "./shapes.ts";
// anonymous literal here shares the imported interface's shape (one struct)
const local: { x: number; y: number } = { x: 1, y: 2 };
const moved = shift(local, 10);
console.log(moved.x, moved.y, local === moved);
const viaFactory = makePoint(5, 5);
console.log(shift(viaFactory, 1).x, made, madeCount());
// cross-module closure over module state
console.log(stashed());
