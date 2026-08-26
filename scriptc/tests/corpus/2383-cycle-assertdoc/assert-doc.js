import { isEmpty } from "./index.js";
const production = process.env.NODE_ENV === "production";
export function assertDoc(doc) {
  if (production || typeof doc === "string") return;
  if (!isEmpty(doc)) console.log("checked", JSON.stringify(doc));
}
