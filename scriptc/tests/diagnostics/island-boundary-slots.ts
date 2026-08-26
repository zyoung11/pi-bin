// @dynamic
// Island ('any'-typed) values in builtin-call slots OUTSIDE the validated
// exit set: primitive and JSON-safe slots exit through the island bridge
// (corpus 2440); a slot typed as a FUNCTION has no island exit — an engine
// function cannot cross into a static callback slot — so the boundary
// pass fences with the slot named instead of handing the validator a
// jsval-typed argument.
const cb: any = () => {};
setTimeout(cb, 1);
