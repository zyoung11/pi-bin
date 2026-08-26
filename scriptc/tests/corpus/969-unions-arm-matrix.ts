// The plain-arm-value → union construction matrix, pinned in one place:
// scalar arms (number, boolean), ref arms (string, record, array), unit
// arms (undefined, null), class arms with derived-into-base widening, and
// arm values reaching the slot through calls, returns, assignments,
// fields, and array elements.

function viaNum(x: number): number | undefined {
  return x;
}
function viaBool(b: boolean): boolean | null {
  return b;
}
function viaStr(s: string): string | undefined {
  return s;
}
console.log(viaNum(3) === 3, viaNum(0 / 0) === undefined, viaBool(false) === false, viaBool(true) === true);
console.log(viaStr("") === "", viaStr("x") === "x");

// Unit arms from the literal side.
function noneNum(): number | undefined {
  return undefined;
}
function noneStr(): string | null {
  return null;
}
console.log(noneNum() === undefined, noneStr() === null);

// Record and array arms: payload identity is the JS aliasing story.
type Rec = { n: number };
function viaRec(r: Rec): Rec | undefined {
  return r;
}
function viaArr(a: number[]): number[] | null {
  return a;
}
const rec: Rec = { n: 5 };
const wrapped = viaRec(rec);
if (wrapped !== undefined) {
  wrapped.n = 6;
}
console.log(rec.n);
const arr = [1];
const wa = viaArr(arr);
if (wa !== null) {
  wa.push(2);
}
console.log(arr.length);

// Class arms; a DERIVED instance widens into the base-class arm.
class Animal {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}
class Dog extends Animal {
  constructor() {
    super("rex");
  }
}
function viaAnimal(a: Animal | undefined): string {
  if (a === undefined) {
    return "none";
  }
  return a.name;
}
console.log(viaAnimal(new Dog()), viaAnimal(new Animal("cat")), viaAnimal(undefined));

// Arm values landing in union-typed FIELDS and array ELEMENTS.
type Slot = { v: string | undefined };
const slot: Slot = { v: "set" };
console.log(slot.v === "set");
slot.v = undefined;
console.log(slot.v === undefined);
const cells: (number | undefined)[] = [1, undefined, 3];
let sum = 0;
for (const c of cells) {
  if (c !== undefined) {
    sum = sum + c;
  }
}
console.log(sum, cells.length);

// let-reassignment across arms of a three-arm union.
let cur: number | string | undefined = undefined;
console.log(cur === undefined);
cur = 4;
console.log(cur === 4);
cur = "four";
console.log(cur === "four", cur === undefined);
