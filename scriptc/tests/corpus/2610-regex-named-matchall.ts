// Named groups on matchAll rows: the for-of binding, the stored drain,
// and spread rows all serve .groups (with .index riding the for-of
// companion as before).
const text = "a=1 b=2 c=3";
const pairs = /(?<key>\w)=(?<val>\d)/g;
for (const m of text.matchAll(pairs)) {
  console.log(m.groups!.key, m.groups!.val, m.index);
}

// Stored drain: rows keep .groups (and rows walk as honest slices).
const rows = text.matchAll(/(?<key>\w)=(?<val>\d)/g);
for (const m of rows) console.log(`${m.groups!.key}->${m.groups!.val}`);

// Spread rows: element access reaches the same projection.
const arr = [...text.matchAll(/(?<key>\w)=(?<val>\d)/g)];
console.log(arr.length, arr[0]![0], arr[1]![1], arr[2]![2]);
console.log(arr[1]!.groups!.key, arr[2]!.groups!.val);

// Destructuring a row's groups.
for (const m of "x9".matchAll(/(?<letter>[a-z])(?<digit>\d)/g)) {
  const { letter, digit } = m.groups!;
  console.log(letter, digit);
}

// matchAll of a group-less regex: rows answer .groups undefined.
const bare = [..."aa".matchAll(/a/g)];
const row0 = bare[0]!;
console.log(bare.length, row0.groups, row0.groups === undefined);
