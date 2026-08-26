import { fill, isEmpty, literalline } from "./index.js";
const f = fill(["x", "y"]);
console.log(f.type, f.parts.length, isEmpty([]), isEmpty(["z"]), literalline.literal);
console.log(f.parts[0], f.parts[1]);
