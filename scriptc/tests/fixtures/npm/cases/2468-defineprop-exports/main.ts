// The Object.defineProperty(exports, 'name', { get }) re-export family
// (tsc's single-name `export { leaf } from './leaf.js'` shape) plus a
// scalar member export: getters chase to their returned member reads,
// literals snapshot through a tail const.
import { leaf, WIDTH } from "gtdefine";

console.log(leaf(), WIDTH * 2);
