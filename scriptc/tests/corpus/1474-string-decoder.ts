// node:string_decoder — the utf8 StringDecoder, Node's exact algorithm:
// write() decodes complete sequences and BUFFERS a trailing truncated
// (but valid) sequence prefix across chunk boundaries; invalid bytes
// become U+FFFD immediately (maximal-subpart replacement, the
// Buffer.toString rules); end() flushes a buffered partial as its
// replacement chars. The split-codepoint matrix below mirrors the oracle
// experiments byte for byte.
import { StringDecoder } from "node:string_decoder";

const run = (label: string, parts: number[][]): void => {
  const d = new StringDecoder("utf8");
  const out: string[] = [];
  for (const p of parts) out.push(JSON.stringify(d.write(Buffer.from(p))));
  out.push(`END ${JSON.stringify(d.end())}`);
  console.log(`${label}: ${out.join(" | ")}`);
};

run("astral split", [[0xf0, 0x9f], [0x92, 0xa9]]);
run("byte at a time", [[0xf0], [0x9f], [0x92], [0xa9]]);
run("euro split", [[0xe2, 0x82], [0xac]]);
run("ascii + partial", [[0x68, 0x69, 0xe2], [0x82, 0xac]]);
run("invalid continuation", [[0xe2], [0x28, 0x41]]);
run("end 2 of 4", [[0xf0, 0x9f]]);
run("end 2 of 3", [[0xe2, 0x82]]);
run("end 3 of 4", [[0xf0, 0x9f, 0x92]]);
run("bare continuations", [[0x80, 0x81]]);
run("end lone lead", [[0xc3]]);
run("invalid lead", [[0xff, 0x41]]);
run("empty write", [[]]);
run("interrupted by new lead", [[0xe2, 0x82], [0xf0]]);
run("plain ascii", [[0x68, 0x65, 0x6c, 0x6c, 0x6f]]);

// The portless prefixStream shape: line-splitting over decoder output
// with a chunk boundary INSIDE a multibyte character.
const d = new StringDecoder("utf8");
let buffer = "";
const chunks = [
  Buffer.from([0x61, 0xe2, 0x82]),
  Buffer.from([0xac, 0x0a, 0x62, 0x0a, 0x63]),
];
for (const chunk of chunks) {
  buffer += d.write(chunk);
  let idx = buffer.indexOf("\n");
  while (idx !== -1) {
    const line = buffer.slice(0, idx);
    buffer = buffer.slice(idx + 1);
    console.log(`line: ${line}`);
    idx = buffer.indexOf("\n");
  }
}
buffer += d.end();
if (buffer) console.log(`tail: ${buffer}`);

// The decoder rides containers and re-decodes after end() (Node resets).
const d2 = new StringDecoder();
console.log("reset:", d2.write(Buffer.from([0xe2])), d2.end(), d2.write(Buffer.from("ok")));
