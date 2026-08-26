// K5's init arm: a trap DURING module evaluation routes to the sink the
// same way an export's trap does. Pre-trap stdout passes through to the
// host's fds untouched (library mode never buffers or rebinds them).
const xs = [1, 2, 3];
console.log("about to trap");
const y = xs[7]!;
console.log(`never ${y}`);
