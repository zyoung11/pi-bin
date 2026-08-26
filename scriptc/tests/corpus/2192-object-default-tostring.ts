// Object.prototype.toString's default answer folds to "[object Object]"
// on records and on program classes with no toString anywhere in the
// hierarchy; a class that DECLARES toString resolves to its own method
// (the user symbol), and an effectful receiver still evaluates first.
class Plain { }
({} as Plain).toString();
(() => {
  ({} as Plain).toString();
})();
class Custom { toString() { return "custom!"; } }
const rec = { a: 1, b: "two" };
console.log(rec.toString());
console.log(new Custom().toString());
const plain = new Plain();
console.log(plain.toString());
function effectful(): { a: number } { console.log("receiver ran"); return { a: 2 }; }
console.log(effectful().toString());
console.log(`in template: ${new Plain().toString()}`);
