// Buffer's comparison/search/mutation surface: equals, compare (instance
// ranges and the static form), indexOf/lastIndexOf/includes over number,
// string-with-encoding, and Buffer needles, fill's pattern repeat and
// error ladder, copy's clamping C++ ladder, swap16/32/64, write's
// unit-boundary truncation, alloc's fill forms, and concat's totalLength.

const caught = (fn: () => number): void => {
  try {
    console.log("ok", fn());
  } catch (e) {
    console.log("caught:", (e as Error).name);
    console.log((e as Error).message);
  }
};

// equals: bytes and length both count.
const a = Buffer.from([1, 2, 3]);
const b = Buffer.from([1, 2, 4]);
console.log(a.equals(b), a.equals(Buffer.from([1, 2, 3])), a.equals(Buffer.from([1, 2])), a.equals(new Uint8Array([1, 2, 3])));

// compare: -1/0/1, the length tiebreak, ranges, empty-window shortcuts.
console.log(a.compare(b), b.compare(a), a.compare(a), Buffer.compare(a, b), Buffer.compare(a, a));
console.log(Buffer.from([1, 2]).compare(Buffer.from([1, 2, 3])), Buffer.compare(Buffer.from([2]), Buffer.from([1, 2])));
console.log(a.compare(b, 1, 3, 0, 2), a.compare(b, 0, 3, 0, 3), a.compare(b, 2), a.compare(b, 0, 1, 3), a.compare(b, 1, 1, 1, 1));
caught(() => a.compare(b, -1));
caught(() => a.compare(b, 1.5));
caught(() => a.compare(b, 0, 99));
caught(() => a.compare(b, 0, 1, 0, 99));

// indexOf / lastIndexOf / includes: every needle kind.
const h = Buffer.from("abcabcabc");
console.log(h.indexOf("bc"), h.indexOf("bc", 2), h.indexOf("x"), h.indexOf(98), h.indexOf(0x62, -4));
console.log(h.indexOf(Buffer.from("ca")), h.includes("ca"), h.includes("ca", 6), h.includes(99), h.includes(Buffer.from("x")));
console.log(h.lastIndexOf("bc"), h.lastIndexOf("bc", 4), h.lastIndexOf(97), h.lastIndexOf("x"));
console.log(h.indexOf(""), h.indexOf("", 4), h.indexOf("", 99), h.lastIndexOf("", 99));
console.log(h.indexOf(354), h.indexOf(-158), h.indexOf(98, 1.5), h.indexOf("bc", 0 / 0), h.lastIndexOf("bc", 0 / 0));
console.log(h.indexOf("bc", -99), h.lastIndexOf("bc", -99), h.indexOf("bc", 99));
console.log(h.indexOf("6263", 0, "hex"), h.indexOf("YmM=", 0, "base64"), h.indexOf("62", "hex"));
const u16 = Buffer.from("610062006300", "hex");
console.log(u16.indexOf("b", "utf16le"), u16.lastIndexOf("b", "utf16le"), u16.includes("b", 0, "utf16le"));
console.log(Buffer.from("0061006200", "hex").indexOf("b", "utf16le"));
console.log(Buffer.from("0061006200", "hex").indexOf(Buffer.from("6200", "hex")));

// fill: single byte, repeating patterns, wrapping values, ranges, and
// the validateOffset ladder ('&&' renders).
console.log(Buffer.alloc(5).fill(7).toString("hex"));
console.log(Buffer.alloc(5).fill("ab").toString());
console.log(Buffer.alloc(5).fill("abc", 1, 4).toString());
console.log(Buffer.alloc(6).fill(Buffer.from([1, 2])).toString("hex"));
console.log(Buffer.alloc(5).fill(300).toString("hex"), Buffer.alloc(5).fill(-1).toString("hex"), Buffer.alloc(5).fill(0 / 0).toString("hex"));
console.log(Buffer.alloc(4).fill("6162", "hex").toString(), Buffer.alloc(4).fill("61626", "hex").toString("hex"));
console.log(Buffer.alloc(5).fill(1, 2).toString("hex"), Buffer.alloc(5).fill(1, 4, 2).toString("hex"), Buffer.alloc(5).fill(1, 7).toString("hex"));
console.log(Buffer.alloc(3).fill("").toString("hex"), Buffer.alloc(3).fill("", 1).toString("hex"));
// fill answers the receiver: chained fills mutate the SAME buffer.
const chain = Buffer.alloc(4);
chain.fill(1, 0, 2).fill(2, 2);
console.log(chain.toString("hex"));
caught(() => Buffer.alloc(5).fill(1, -1).length);
caught(() => Buffer.alloc(5).fill(1, 2, 99).length);
caught(() => Buffer.alloc(5).fill(1, 1.5).length);
caught(() => Buffer.alloc(2).fill(Buffer.alloc(0)).length);

// copy: byte counts, clamps, silent fractional truncation, the ladder.
const src = Buffer.from("abcdef");
const dst = Buffer.alloc(4);
console.log(src.copy(dst, 1, 2, 5), dst.toString());
console.log(Buffer.from("ab").copy(Buffer.alloc(4), 3), src.copy(Buffer.alloc(4), 0, 4, 99), src.copy(Buffer.alloc(4), 5));
console.log(src.copy(Buffer.alloc(4), 0, 1.5, 3.5));
caught(() => src.copy(dst, -1));
caught(() => src.copy(dst, 0, -1));
caught(() => src.copy(dst, 0, 9));
caught(() => src.copy(dst, 0, 0, -1));

// swap16/32/64: in-place group reversal, chaining, the size gates.
console.log(Buffer.from("0102030405060708", "hex").swap16().toString("hex"));
console.log(Buffer.from("0102030405060708", "hex").swap32().toString("hex"));
console.log(Buffer.from("0102030405060708", "hex").swap64().toString("hex"));
const sw = Buffer.from([1, 2]);
sw.swap16();
console.log(sw.toString("hex"));
caught(() => Buffer.from([1, 2, 3]).swap16().length);
caught(() => Buffer.from([1, 2, 3]).swap32().length);
caught(() => Buffer.from([1, 2, 3, 4, 5, 6, 7]).swap64().length);

// write: returned counts, whole-character truncation, encodings, the
// offset/length gates.
const w = Buffer.alloc(6);
console.log(w.write("ab"), w.toString("hex"));
console.log(w.write("abc", 2), w.toString("hex"));
console.log(w.write("abcdef", 2, 3), w.toString("hex"));
console.log(Buffer.alloc(4).write("héx"), Buffer.alloc(3).write("h😀"), Buffer.alloc(5).write("h😀x"));
const wh = Buffer.alloc(8);
console.log(wh.write("6162", "hex"), wh.toString("hex"));
console.log(wh.write("abc", 4, "utf16le"), wh.toString("hex"));
console.log(wh.write("a😀", 1, 4, "utf16le"), wh.toString("hex"));
caught(() => Buffer.alloc(3).write("a", 5));
caught(() => Buffer.alloc(3).write("a", -1));
caught(() => Buffer.alloc(6).write("a", 0, -1));
caught(() => Buffer.alloc(6).write("abcdef", 2, 99));
caught(() => Buffer.alloc(6).write("abcdef", 2, 3.5));

// alloc's fill forms and concat's totalLength.
console.log(Buffer.alloc(4, 7).toString("hex"), Buffer.alloc(4, "ab").toString(), Buffer.alloc(4, "6162", "hex").toString("hex"));
console.log(Buffer.alloc(6, Buffer.from([1, 2])).toString("hex"), Buffer.alloc(3, "").toString("hex"));
console.log(Buffer.concat([Buffer.from([1, 2]), Buffer.from([3])], 5).toString("hex"));
console.log(Buffer.concat([Buffer.from([1, 2]), Buffer.from([3])], 2).toString("hex"));
console.log(Buffer.concat([], 3).toString("hex"), Buffer.concat([], 0).length);
caught(() => Buffer.concat([Buffer.from([1])], -1).length);
caught(() => Buffer.concat([Buffer.from([1])], 1.5).length);
