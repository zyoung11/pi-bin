const n: number = 7;
console.log(n > 5 ? "big" : "small");
console.log(n % 2 === 0 ? 0 : 1);
console.log(n < 0 ? "neg" : n === 0 ? "zero" : "pos");
const flag: boolean = n > 3 ? n < 10 : false;
console.log(flag);

// laziness: only the taken arm's side effects run
function loud(tag: string, value: number): number {
  console.log("evaluating", tag);
  return value;
}
console.log(n > 5 ? loud("then", 1) : loud("else", 2));
console.log(n < 5 ? loud("then", 3) : loud("else", 4));

// string result ownership through both arms
const s: string = n > 5 ? `n=${n}` : "small";
console.log(s + (n > 100 ? "!" : "?"));
