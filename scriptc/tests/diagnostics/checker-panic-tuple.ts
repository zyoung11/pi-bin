// `''.match(/x/) || []` drives tsgo into the TupleType interface-conversion
// panic (upstream signature 01/13): the panic fence turns it into the
// source-anchored SC0004 — a failed compile, never a crashed CLI.
const a = ''.match(/x/) || [];
console.log(a.length);
