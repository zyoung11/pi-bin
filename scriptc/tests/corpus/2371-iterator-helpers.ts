// Iterator helpers (ES2025) over array iterators: map/filter/take/drop/
// flatMap chains fuse into the helpers' lazy pull order (each element
// flows through every stage before the next is touched; take closes the
// pipeline without another upstream pull), callbacks see per-stage
// counters, budgets validate eagerly with Node's RangeError, and the
// terminals (toArray/forEach/reduce/some/every/find) short-circuit.
const seen: string[] = [];
const r = [1, 2, 3, 4].values().map((x) => { seen.push("m" + x); return x * 10; }).filter((x) => { seen.push("f" + x); return x > 10; }).take(2).toArray();
console.log(r.join(","), "|", seen.join(","));
console.log([10, 20, 30].values().filter((v, i) => i > 0).map((v, i) => v + "@" + i).toArray().join("|"));
console.log([1, 2, 3].values().drop(1).toArray().join(","));
console.log([1, 2, 3].values().reduce((a, b) => a + b), [1, 2, 3].values().reduce((a, b) => a + b, 10), [1, 2, 3].values().reduce((a, v, i) => a + v * i, 0));
console.log([1, 2, 3].values().some((x) => x === 2), [1, 2, 3].values().every((x) => x > 0), [1, 2, 3].values().find((x) => x > 1) ?? -1, [1, 2].values().find((x) => x > 9) ?? -1);
console.log([1, 2].values().flatMap((x) => [x, x * 100]).toArray().join(","));
let hits = 0;
[5, 6, 7].values().forEach((v, i) => { hits += v * (i + 1); });
console.log(hits);
console.log([1, 2, 3].values().take(0).toArray().length, [1, 2, 3].values().take(Infinity).toArray().join(","), [1, 2, 3].values().take(2.7).toArray().join(","), [1, 2, 3].values().drop(1.9).toArray().join(","));
try { [1].values().take(-1).toArray(); } catch (e) { console.log("caught", (e as Error).name, (e as Error).message); }
try { [1].values().drop(0 / 0).toArray(); } catch (e) { console.log("caught", (e as Error).name, (e as Error).message); }
try { const e2: number[] = []; e2.values().reduce((a, b) => a + b); } catch (e) { console.log("caught", (e as Error).name, (e as Error).message); }
// take closes the pipeline: nothing upstream runs after the nth delivery.
const pulls: string[] = [];
const out2 = [1, 2, 3, 4].values().map((x) => { pulls.push("m" + x); return x; }).take(2).filter((x) => { pulls.push("f" + x); return x % 2 === 0; }).toArray();
console.log(out2.join(","), "|", pulls.join(","));
// flatMap + take: the inner walk stops mid-array.
const seen2: string[] = [];
console.log([1, 2, 3].values().flatMap((x) => { seen2.push("g" + x); return [x, -x]; }).take(3).toArray().join(","), "|", seen2.join(","));
// The source iterates LIVE: growth during the walk is visited.
const live: number[] = [1, 2];
const grown = live.values().map((x) => { if (x === 1) live.push(99); return x; }).toArray();
console.log(grown.join(","), live.length);
// A long mixed chain.
console.log([1, 2, 3, 4, 5, 6].values().drop(1).map((x) => x * 2).filter((x) => x % 3 !== 0).take(3).toArray().join(","));
