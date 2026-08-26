// @dynamic
// Uint8Array members of package results exit the island eagerly as
// validated u8 COPIES (the generated-media payload pattern:
// Buffer.from(result.audio.uint8Array)): lengths and elements are
// value-exact, engine Uint8Array SUBCLASS instances pass (Buffer is one in
// Node), and the empty view works. (A LYING declaration throws the
// catchable boundary TypeError where Node silently proceeds — the usual
// trust-but-verify divergence, deliberately not Node-compared here.)
import { emptyChunk, makeAudio, subclassChunk } from "media";

const audio = makeAudio(5);
const bytes = audio.uint8Array;
console.log(audio.label, bytes.length, bytes[0], bytes[4]);

const buf = Buffer.from(makeAudio(3).uint8Array);
console.log(buf.length, buf[0] + buf[1] + buf[2]);

console.log(emptyChunk().uint8Array.length);

const sub = subclassChunk().uint8Array;
console.log(sub.length, String.fromCharCode(...sub));

// The exit is a COPY (divergence 44's stance): static writes stay static.
const copied = makeAudio(2).uint8Array;
copied[0] = 200;
console.log(copied[0], makeAudio(2).uint8Array[0]);
