export * from "./builders.js";
export function isEmpty(doc) {
  return doc == null || (Array.isArray(doc) && doc.length === 0);
}
