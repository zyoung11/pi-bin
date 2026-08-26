// Delete fences: a HYBRID index-signature shape (declared fields + overflow)
// cannot delete — overflow keys are runtime state against declared struct
// slots (pure Record<string, T> shapes and declared OPTIONAL fields delete;
// tsc itself rejects deleting required fields).
type Hybrid = { base: string; [k: string]: string };
const h: Hybrid = { base: "b", extra: "e" };
delete h["extra"];
console.log(h.base);
