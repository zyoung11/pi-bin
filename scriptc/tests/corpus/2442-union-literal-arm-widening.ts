// SC2003 field-widening literal admission: an object
// literal whose fields widen PER FIELD into exactly one union arm
// ({ kind: "got", parsed: 4 } — parsed widens into number | null)
// builds AS that arm; a redundant kind guard inside a narrowed arm
// must restore every narrowing map.
type Msg =
  | { readonly kind: "got"; readonly parsed: number | null }
  | { readonly kind: "miss" };
function score(msg: Msg): number {
  switch (msg.kind) {
    case "got": {
      const marker = msg.kind === "got" ? 1 : 2;
      return msg.parsed !== null ? msg.parsed + marker : 0;
    }
    case "miss":
      return -1;
  }
}
function tally(msg: Msg): number {
  switch (msg.kind) {
    case "got": {
      let bonus = 0;
      if (msg.kind === "got") {
        bonus = 5;
      }
      return msg.parsed === null ? bonus : msg.parsed + bonus;
    }
    case "miss":
      return -1;
  }
}
console.log(score({ kind: "got", parsed: 4 }));
console.log(score({ kind: "got", parsed: null }));
console.log(score({ kind: "miss" }));
console.log(tally({ kind: "got", parsed: 4 }));
console.log(tally({ kind: "got", parsed: null }));
