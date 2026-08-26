// The trailing-argument timer forms: Node passes the extras to the
// callback — setTimeout(cb, ms, ...args) fires cb(...args), setInterval
// delivers the same arguments EVERY tick, setImmediate(cb, ...args)
// likewise — and the one-argument setTimeout defaults its delay (the
// callback still fires exactly once). The delivered call rides the
// checked-dynamic boundary, so typed parameters see the real values.
setTimeout((a: string, b: number, c: boolean) => {
  console.log("timeout got", a, b, c);
}, 1, "x", 42, true);
let n = 0;
const iv = setInterval((tag: string, k: number) => {
  n++;
  console.log("tick", tag, k, n);
  if (n === 2) {
    clearInterval(iv);
    setImmediate((last: string) => {
      console.log("immediate got", last);
    }, "done");
  }
}, 1, "z", 7);
setTimeout(() => {
  console.log("one-arg setTimeout fired");
});
console.log("main done");
