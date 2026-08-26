import { assertDoc } from "./assert-doc.js";
export function fill(parts) {
  assertDoc(parts);
  return { type: "fill", parts };
}
export const literalline = { type: "line", literal: true };
