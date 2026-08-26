// A setTimeout callback reading `arguments` infers the variadic
// func(...dyn[])=>void shape (invariant signature 12): it adapts through the
// checked-dynamic function boundary — the timer invokes it with zero
// arguments, exactly Node.
setTimeout(function () {
  console.log("ticked", arguments.length);
}, 0);
console.log("scheduled");
