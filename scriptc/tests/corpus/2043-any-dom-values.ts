// `any` values as dyn data: keyed reads and writes on any-typed objects,
// arrays through any slots, JSON round trips, strict equality across the
// dyn, casts in and out, and console rendering of composite values.

// Property writes and reads through an any-typed object (keyword keys
// included — dyn member names have no identifier restriction).
const obj: any = {};
obj.if = 1;
obj.name = "n";
console.log(obj.if, obj.name);
console.log(obj.missing === undefined);
console.log(obj);

// A FRESH record literal into an any slot: nothing aliases the literal,
// so the dyn conversion is unobservable and writes land on the one value.
// (A NAMED record flowing into any is a deep copy where JS aliases — the
// dynFrom stance, documented, pinned in dyncheck.test.ts, not here.)
const copy: any = { a: 1 };
copy.a = 2;
console.log(copy.a);

// Arrays through any: length and element reads ride the keyed dyn.
const arr: any = [3, 1, 2];
console.log(arr.length, arr[0], arr[2]);
console.log(arr);

// JSON.parse results are checker-any already — one value world.
const parsed: any = JSON.parse('{"k":[true,null,"s"]}');
console.log(parsed.k[0], parsed.k[1], parsed.k[2]);

// Strict equality: scalars by value, reference kinds by identity.
const one: any = 1;
const uno: any = 1;
console.log(one === uno, one === 2);
const box: any = { v: 1 };
const same: any = box;
console.log(box === same);

// Casts of concrete values to `any` erase; casts out validate. (The
// angle-bracket spelling `<any>e` lowers identically — it is not
// strip-types syntax, so the corpus uses `as any`.)
var tpl = `abc${123}def` as any;
console.log(tpl);
const backOut: string = tpl;
console.log(backOut.length);

// Optional chaining through any values.
const maybe: any = undefined;
console.log(maybe?.k === undefined);
const there: any = { k: "v" };
console.log(there?.k);

// void interplay: any slots absorb void-typed values as undefined.
var x: void;
var y: any;
var z: void;
y = x;
x = y;
x = z;
console.log(typeof y);
