// "#/"-prefixed imports-field aliases resolve through "#/*" pattern keys
// on current Node (probed on v24.15.0 — only the bare "#" specifier is
// invalid), so they are ordinary project imports here too.
import { fromWild } from "#/x.ts";
console.log(fromWild);
