// Namespace imports of a user module: every member access resolves
// statically — functions (direct calls), classes (new/instanceof), enums,
// consts, LIVE mutable members (Node's namespace properties alias the
// exporter's storage), the default export as `ns.default`, and reads from
// function bodies.
import * as geo from "./geo.ts";

const p = new geo.Point(3, -4);
console.log(p.norm(), p instanceof geo.Point);
console.log(geo.Axis.X + geo.Axis.Y, geo.SCALE, geo.origin().norm());
console.log(geo.hits);
geo.record();
geo.record();
console.log(geo.hits);
function viaBody(): number {
  return geo.SCALE + geo.hits;
}
console.log(viaBody());
console.log(geo.default);
