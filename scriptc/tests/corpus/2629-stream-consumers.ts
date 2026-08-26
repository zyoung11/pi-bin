// stream/consumers — the promise consumers over real readables: text
// accumulates and utf8-decodes (multibyte sequences SPLIT across chunk
// boundaries decode whole), buffer concatenates the bytes, json parses
// the accumulated text, and string-chunk streams (setEncoding) feed the
// same consumers through their utf8 bytes. Resolution lands after
// 'close' (the consumer iterates through eos), Node's timing.
import { Readable } from "node:stream";
import { buffer, json, text } from "node:stream/consumers";

async function main(): Promise<void> {
  // text: three byte chunks, the middle pair splitting a 3-byte UTF-8
  // sequence (é in "café" is fine — use a CJK char split mid-sequence).
  const bytes = Buffer.from("café 世界", "utf8");
  const r1 = new Readable({ read() {} });
  r1.push(bytes.subarray(0, 3));
  r1.push(bytes.subarray(3, 7)); // ends mid-CJK-sequence
  r1.push(bytes.subarray(7));
  r1.push(null);
  const t = await text(r1);
  console.log("text:", t, t.length);

  // buffer: the concatenation, chunk boundaries erased.
  const r2 = new Readable({ read() {} });
  r2.push(Buffer.from([1, 2, 3]));
  r2.push(Buffer.from([4, 5]));
  r2.push(null);
  const b = await buffer(r2);
  console.log("buffer:", b.length, b[0], b[4], b.toString("hex"));

  // json: the parsed document (unknown — a checked cast validates).
  const r3 = new Readable({ read() {} });
  r3.push('{"name":"con');
  r3.push('sumers","n":[1,2');
  r3.push(",3]}");
  r3.push(null);
  const doc = (await json(r3)) as { name: string; n: number[] };
  console.log("json:", doc.name, doc.n.length, doc.n[2]);

  // A string-chunk stream (setEncoding): text concatenates the strings,
  // buffer takes their utf8 bytes.
  const r4 = new Readable({ read() {} });
  r4.setEncoding("utf8");
  r4.push("ab");
  r4.push("çd");
  r4.push(null);
  console.log("encoded text:", await text(r4));
  const r5 = new Readable({ read() {} });
  r5.setEncoding("utf8");
  r5.push("ç");
  r5.push(null);
  console.log("encoded buffer:", (await buffer(r5)).toString("hex"));

  // Resolution timing: the consumer settles after 'close' (eos).
  const r6 = new Readable({ read() {} });
  const order: string[] = [];
  r6.on("close", () => {
    order.push("close");
    console.log("order:", order.join(","));
  });
  const p6 = text(r6).then((s) => {
    order.push(`text(${s})`);
  });
  r6.push("z");
  r6.push(null);
  await p6;

  // An empty stream resolves the empty results.
  const r7 = new Readable({ read() {} });
  r7.push(null);
  console.log("empty text:", JSON.stringify(await text(r7)));
  const r8 = new Readable({ read() {} });
  r8.push(null);
  console.log("empty buffer:", (await buffer(r8)).length);
}

void main();
