// Factories, shared bindings, arrows, higher-order functions.
function makeCounter(start: number): () => number {
  let n = start;
  return () => {
    n = n + 1;
    return n;
  };
}
const c1 = makeCounter(0);
const c2 = makeCounter(100);
console.log(c1(), c1(), c2(), c1(), c2());

// two closures over ONE binding observe each other's mutations
function makeAccount(balance: number): (delta: number) => number {
  const apply = (d: number) => {
    balance = balance + d;
    return balance;
  };
  return apply;
}
const acct = makeAccount(50);
console.log(acct(25), acct(-30), acct(0));

const double = (x: number) => x * 2;
const shout = (s: string) => s + "!";
function applyNum(fn: (x: number) => number, x: number): number {
  return fn(x);
}
function applyStr(fn: (s: string) => string, s: string): string {
  return fn(s);
}
console.log(applyNum(double, 7), applyStr(shout, "hey"));

// IIFE and immediately-applied results
console.log(((x: number) => x + 1)(41));
console.log(makeCounter(7)());

// closures capturing strings and arrays
function tagger(tag: string): (n: number) => string {
  return (n: number) => `[${tag}:${n}]`;
}
const t1 = tagger("a");
const t2 = tagger("bb");
console.log(t1(1) + t2(2) + t1(3));

function pusher(target: number[]): (v: number) => number {
  return (v: number) => target.push(v);
}
const nums: number[] = [];
const push = pusher(nums);
push(10);
push(20);
console.log(nums.length, nums[0], nums[1]);
