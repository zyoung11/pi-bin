// @dynamic
// Leak pressure for the sanitized lane: many island entries that allocate
// engine objects and marshal fresh strings back across the boundary. The
// engine's counting allocator asserts zero live allocations at teardown and
// the RC audit checks every marshaled ScrStr was released.
let checksum = 0;
let last = "";
for (let i = 0; i < 300; i = i + 1) {
  const code =
    "(function () { var o = { n: " +
    i +
    ", tag: 'it' + " +
    i +
    ", arr: [" +
    i +
    ", " +
    i +
    " * 2] }; return o.tag + ':' + (o.n + o.arr[1]); })()";
  last = __island_eval(code);
  checksum = checksum + last.length;
}
console.log(last, checksum);
