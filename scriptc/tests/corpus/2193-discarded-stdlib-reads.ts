// DISCARDED pure reads/calls over the standard-library globals lower to
// nothing — Node evaluates and throws the value away with zero observable
// effect: bare member reads on stdlib globals (comment-riddled spellings
// included), element reads with literal keys, optional-chain spellings,
// and the pure prototype-method calls on Array.prototype/String.prototype
// (slice over the shared EMPTY prototype array/string).
console.log("start");
/*0*/ Array /*1*/[ /*2*/ "toString" /*3*/ ] /*4*/; /*5*/
/*1*/Array/*2*/./*3*/toString/*4*/;
Array?.toString;
Math.PI;
Array.prototype.slice();
Array.prototype.slice(0);
Array.prototype.slice(0, 1);
String.prototype.slice();
String.prototype.slice(0, 1);
console.log("end");
