// Object.create's fence battery: only the null-prototype dictionary
// lowers in a static build (Object.create(null) — corpus 2581/2582).
// Every other prototype is a NAMED fence, not an own-copy stand-in: Node
// lists NO own keys on the created object (Object.keys/inspect/JSON all
// answer empty) and mutating the prototype afterwards shows through it
// LIVE — observations a copy answers wrong silently.

// A static record prototype.
const base = { indent: 2 };
const viaRecord = Object.create(base);

// A checked-dynamic (dyn) prototype.
const dynProto: object = JSON.parse('{"a":1}');
const viaDyn = Object.create(dynProto);

// The properties-descriptor form.
const withDescriptors = Object.create(null, { a: { value: 1, enumerable: true } });
