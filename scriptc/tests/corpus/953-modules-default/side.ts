// A SECOND importer of the same default: both importers alias the same
// exporter binding (one global, one initialization).
import colors from "./colors.ts";

console.log("side init", colors.red("r"));

export function fromSide(name: string): string {
  return colors.bold(name);
}
