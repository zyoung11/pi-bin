// arr.entries()/arr.keys() consumed directly by a for-of head — the
// dominant formatter idiom (`for (const [index, line] of
// rawLineContents.entries())`): the LIVE index walk, exactly the array
// iterator's contract — the length re-reads every pass, so elements
// appended mid-walk are visited and a shrink ends the loop early.
// `[i, v]` heads of plain identifiers bind straight from the reads (the
// pair tuple never materializes); identifier heads bind the checker's
// own [number, T] tuple; holes, object patterns, defaults, `let`, and
// `var` heads ride the ordinary binding desugars. Node is the oracle
// byte-for-byte.
const words: string[] = ["alpha", "beta", "gamma"];
for (const [i, w] of words.entries()) {
  console.log(i, w);
}

// Index-only heads, and keys() as the index iterator.
const nums = [10, 20, 30];
for (const [i] of nums.entries()) console.log("i", i);
for (const k of nums.keys()) console.log("k", k);

// An identifier head binds the [number, T] pair tuple itself.
for (const pair of words.entries()) {
  console.log(pair[0], pair.length, pair[1]);
}

// Holes and object patterns over the pair.
for (const [, w] of words.entries()) console.log("w", w);
for (const { 0: idx, 1: word } of words.entries()) console.log(idx, word);

// Number elements through arithmetic — index times value.
let sum = 0;
for (const [i, n] of nums.entries()) sum += i * n;
console.log(sum);

// LIVE iteration: appends made mid-walk are visited (the length
// re-reads), and break exits normally.
const live = ["a"];
for (const [i, v] of live.entries()) {
  if (i < 2) live.push(v + "!");
  console.log(i, v);
  if (i > 3) break;
}
console.log(live.length);

// let heads reassign their per-iteration binding; var heads share one
// hoisted slot that persists after the loop.
for (let [i, w] of words.entries()) {
  i += 1;
  console.log(i, w);
}
for (var [vi, vw] of words.entries()) {
  if (vi === 2) break;
}
console.log("after", vi!, vw!);

console.log("done");
