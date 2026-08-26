// `case null:` / `case undefined:` over union discriminants: a unit case the union HOLDS is a tag test; a unit case the union LACKS never matches (JS skips it — no coercion of the literal into the union). Grouped unit cases and defaults keep source order.
const items = [1, 2, 3];
const miss = items.find((n) => n > 50);
const hit = items.find((n) => n > 2);
switch (miss) {
  case null:
    console.log("never: null");
    break;
  case undefined:
    console.log("miss is undefined");
    break;
  default:
    console.log("never: default");
    break;
}
switch (hit) {
  case null:
    console.log("never: null");
    break;
  case 3:
    console.log("hit is three");
    break;
  default:
    console.log("never: default");
    break;
}
function tri(flag: number): string | null {
  return flag > 0 ? "pos" : null;
}
const triple = tri(-1);
switch (triple) {
  case undefined:
    console.log("never: undefined");
    break;
  case "pos":
    console.log("never: pos");
    break;
  case null:
    console.log("tri gave null");
    break;
}
switch (miss) {
  case null:
  case undefined:
    console.log("grouped unit cases match the undefined arm");
    break;
  default:
    console.log("never: grouped default");
    break;
}
