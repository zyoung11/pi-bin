// `T | null` unions: null literal assignment, `!== null` / `=== null`
// narrowing, reassignment across arms, and checker-narrowed re-checks.

function parseDigit(s: string): number | null {
  if (s === "1") {
    return 1;
  }
  if (s === "2") {
    return 2;
  }
  return null;
}
const two = parseDigit("2");
if (two !== null) {
  console.log("digit", two + 1);
}
const nope = parseDigit("x");
console.log(nope === null);
if (nope === null) {
  console.log("no digit");
} else {
  console.log("impossible", nope);
}

// Reassignment across arms; the checker narrows past the union after the
// assignment, so the re-check is statically decided (and still true).
let cur: number | null = null;
console.log(cur === null);
cur = 5;
if (cur !== null) {
  console.log(cur * 2);
}

// Record fields hold null-armed unions (recordSet releases the old box).
type Slot = { name: string; value: string | null };
const slot: Slot = { name: "a", value: null };
console.log(slot.value === null);
slot.value = "filled";
const v = slot.value;
if (v !== null) {
  console.log(slot.name, v);
}

// null and undefined are DISTINCT arms of one union.
function tri(n: number): string | null | undefined {
  if (n > 0) {
    return "pos";
  }
  if (n < 0) {
    return null;
  }
  return undefined;
}
console.log(tri(-1) === null);
console.log(tri(0) === undefined);
console.log(tri(0) === null);
const t = tri(3);
if (t !== null) {
  console.log(t !== undefined);
}
