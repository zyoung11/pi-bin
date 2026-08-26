// RC stress for parameter completion: omitted optional strings, defaulted
// string/record params, and rest packs of refcounted elements, churned in
// loops (the sanitizer lane audits every retain/release).
function decorate(core: string, prefix?: string, suffix: string = core + "|"): string {
  let out = core;
  if (prefix !== undefined) out = prefix + out;
  return out + suffix;
}

function collect(...items: string[]): string {
  let s = "";
  for (const it of items) s += it;
  return s;
}

class Node2 {
  value: string;
  children: string[];
  constructor(value: string = "root", ...children: string[]) {
    this.value = value;
    this.children = children;
  }
  render(sep: string = "/", cap?: string): string {
    let out = this.value;
    for (const ch of this.children) out += sep + ch;
    if (cap !== undefined) out += cap;
    return out;
  }
}

let acc = "";
for (let i = 0; i < 200; i++) {
  const s = "s" + i;
  const d1 = decorate(s);
  const d2 = decorate(s, "p" + i);
  const d3 = decorate(s, undefined, "!" + i);
  const packed = collect(d1, d2, d3);
  const packedEmpty = collect();
  const n = i % 3 === 0 ? new Node2() : new Node2("v" + i, d1, s);
  const r = i % 2 === 0 ? n.render() : n.render("-", "." + i);
  if (i % 50 === 0) console.log(packed + packedEmpty + r);
  acc = r;
}
console.log("last " + acc);

// Deep churn through defaulted record params.
function bump(p: { n: number; tag: string } = { n: 0, tag: "fresh" }, by: number = 1): string {
  p.n += by;
  return p.tag + ":" + p.n;
}
let last = "";
for (let i = 0; i < 100; i++) {
  last = i % 2 === 0 ? bump() : bump({ n: i, tag: "given" + i }, i);
}
console.log(last);
