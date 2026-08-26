// @dynamic
// The island's node:buffer and node:string_decoder shims, differentially
// against Node: Buffer.from/alloc/concat across the seven encodings, the
// numeric accessor family with Node's exact range errors, search/fill/
// copy/swap, the <Buffer ..> inspect form, the Buffer global, and
// StringDecoder's streaming state — every line byte-exact (bufzoo runs
// the surface inside the engine).
import { report } from "bufzoo";

const out: string = report();
console.log(out);
