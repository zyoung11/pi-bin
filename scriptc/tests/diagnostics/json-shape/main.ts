/* A JSON document whose shape doesn't bake: a null-valued field has no
 * standalone STATIC type, so the import reports the dynamic-family type
 * diagnostic (SC2011 at the import site — the shape maps in the embedded
 * engine) and uses of the binding poison. */
import bad from "./nulled.json" with { type: "json" };

console.log(bad.name);
