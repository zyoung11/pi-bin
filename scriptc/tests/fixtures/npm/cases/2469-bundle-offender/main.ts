// A TYPE-ONLY name has no JS value the inferred surface can carry: the
// import site reports against the package, and the offender attribution
// degrades exactly that package to the island with a note — never a
// failed gate (coverage pins this; there is no differential run).
import { look, GhostShape } from "gtghost";

const g: GhostShape = { id: 4 };
console.log(look(), g.id);
