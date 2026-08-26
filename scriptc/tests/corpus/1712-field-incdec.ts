// Expression-position ++/-- over CLASS FIELDS (typed f64): prefix yields
// the NEW value, postfix the OLD, receiver evaluated once — `arr[obj.n++]`,
// `if (--this.n === 0)`, and method receivers.
class Cursor {
  pos: number;
  constructor(pos: number) {
    this.pos = pos;
  }
  rewindHits(): number {
    let hits = 0;
    while (this.pos > 0) {
      if (--this.pos === 0) hits += 1;
    }
    return hits;
  }
}

const c = new Cursor(3);
console.log("prefix:", --c.pos, "now:", c.pos);
console.log("postfix:", c.pos++, "now:", c.pos);

const letters = ["a", "b", "c", "d"];
const idx = new Cursor(0);
console.log(letters[idx.pos++], letters[idx.pos++], letters[idx.pos]);

const r = new Cursor(4);
console.log("rewind hits:", r.rewindHits(), "pos:", r.pos);
