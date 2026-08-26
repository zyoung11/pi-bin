// JS-source #private members: Node runs this file natively (no strip), scriptc compiles it through checkJs inference — private fields, methods, accessors, statics, and a private generator in a plain .js class, class expressions included. Untyped params ride the usual JS checked-dynamic story; the privates themselves lower exactly like their TS twins.
class Acc {
  #total = 0;
  #history = "";
  #add(n) {
    const step = typeof n === "number" ? n : 0;
    this.#total += step;
    this.#history += `+${step}`;
    return this.#total;
  }
  get #snapshot() {
    return this.#total * 10;
  }
  set #snapshot(v) {
    this.#total = typeof v === "number" ? v / 10 : 0;
  }
  static #origin = 5;
  static #shift(x) {
    return typeof x === "number" ? x + Acc.#origin : Acc.#origin;
  }
  *#drain() {
    yield this.#total;
    yield this.#snapshot;
  }
  run() {
    console.log(this.#add(2));
    console.log(this.#add(3));
    console.log(this.#snapshot);
    this.#snapshot = 90;
    console.log(this.#total);
    console.log(Acc.#shift(1));
    let out = "";
    for (const v of this.#drain()) out += `${v};`;
    console.log(out);
    console.log(this.#history);
  }
}
new Acc().run();

const Named = class Inner {
  #tag = "in";
  show() {
    return this.#tag + "!";
  }
};
console.log(new Named().show());
