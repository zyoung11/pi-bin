// RegExpExecArray.index on for-of-over-matchAll bindings: the drain records
// each match's UTF-16 start index into a companion array, and `m.index`
// reads the current row's entry. Indices are UTF-16-exact (astral chars
// count two units), always a number on a drain row (every row matched), so
// the `?? 0` idiom folds to the number.
const s = "a1 b22 c3";
for (const match of s.matchAll(/[a-z](\d+)/g)) {
  console.log(match[0], match[1], match.index ?? 0);
}

// Astral receivers: indices are UTF-16 units, not code points.
const astral = "x\u{1F600}y12\u{1F600}\u{1F600}z34";
for (const m of astral.matchAll(/\d\d/g)) {
  console.log(m[0], m.index ?? 0);
}

// Empty matches advance one unit; each empty match still has its index.
const empties: number[] = [];
for (const m of "ab".matchAll(/(?:)/g)) {
  empties.push(m.index ?? 0);
}
console.log(JSON.stringify(empties));

// continue does not skip the cursor; index composes with slice — the
// ngrok extract shape: look BEHIND each match.
const output = "noise forwarding https://one.test noise url=https://two.test";
for (const match of output.matchAll(/https:\/\/[^\s]+/g)) {
  const raw = match[0];
  const matchIndex = match.index ?? 0;
  const before = output.slice(Math.max(0, matchIndex - 12), matchIndex);
  if (!before.includes("forwarding") && !before.includes("url=")) continue;
  console.log(raw, matchIndex, JSON.stringify(before));
}

// A shadowing declaration has its own symbol — its .length reads normally
// and the OUTER binding's index keeps serving after the inner scope.
for (const m of "q7".matchAll(/\d/g)) {
  {
    const inner: string[] = ["z"];
    console.log(inner.length, m.index ?? 0);
  }
  console.log(m[0], m.index ?? 0, m.length);
}

// No matches: the loop body never runs.
for (const m of "aaa".matchAll(/\d/g)) {
  console.log("unreachable", m.index ?? 0);
}

// The STORED-drain shape (the ngrok extract idiom): a function-local
// const bound directly to matchAll keeps its companion, and the later
// for-of serves .index (module-scope stored drains keep the fence).
function extract(outputText: string): void {
  const urlMatches = outputText.matchAll(/https:\/\/[^\s]+/g);
  for (const match of urlMatches) {
    const raw = match[0];
    const matchIndex = match.index ?? 0;
    console.log(raw, matchIndex);
  }
}
extract("see https://a.test and https://b.test/x");
console.log("done");
