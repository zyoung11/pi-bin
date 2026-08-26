// RC torture for records: created and dropped in loops, refcounted fields
// (strings, arrays, nested records, closures) reassigned repeatedly, records
// swapped between bindings and threaded through calls. NO cycles anywhere —
// the sanitized lane (ASan + RC audit) must come out clean.
interface Item {
  name: string;
  values: number[];
}
type Box = { item: Item; note: string };

function wrap(name: string, seed: number): Box {
  return { item: { name, values: [seed, seed + 1] }, note: `wrap(${name})` };
}

let box: Box = wrap("first", 0);
console.log(box.item.name, box.note);
for (let i = 0; i < 100; i++) {
  box = wrap(`gen${i}`, i); // previous box, item, string, array all die
  box.item.values.push(i * 2);
  const item = box.item;
  item.name += "!";
  box.note = box.note + "+"; // string field churn
}
console.log(box.item.name, box.note.length, box.item.values.length);

// field reassignment: nested record fields replaced in a loop
for (let i = 0; i < 50; i++) {
  box.item = { name: `swap${i}`, values: [i] }; // old item dies each round
}
console.log(box.item.name, box.item.values[0]);

// aliases keep records alive exactly as long as needed
let keeper: Item = box.item;
box = wrap("detached", 7); // keeper still holds the old item
console.log(keeper.name, keeper.values.length);
keeper = box.item; // the swap49 item dies here
console.log(keeper.name);

// records captured by closures made and dropped in bulk
let survivor: () => string = () => "none";
for (let i = 0; i < 25; i++) {
  const temp: Box = wrap(`c${i}`, i);
  const read = (): string => temp.item.name;
  survivor = read; // previous closure + its captured box die
}
console.log(survivor());

// swap dance: two records exchanging a refcounted field repeatedly
const left = { payload: ["L"] };
const right = { payload: ["R"] };
for (let i = 0; i < 20; i++) {
  const t = left.payload;
  left.payload = right.payload;
  right.payload = t;
}
console.log(left.payload[0], right.payload[0]);

// deep chain built and torn down (acyclic: each level owns the next-inner)
type L1 = { s: string };
type L2 = { inner: L1; tag: string };
type L3 = { inner: L2; tags: string[] };
let deep: L3 = { inner: { inner: { s: "seed" }, tag: "t" }, tags: [] };
for (let i = 0; i < 30; i++) {
  deep = {
    inner: { inner: { s: `s${i}` }, tag: deep.inner.tag + "." },
    tags: [deep.inner.inner.s],
  };
}
console.log(deep.inner.inner.s, deep.inner.tag.length, deep.tags[0]);
