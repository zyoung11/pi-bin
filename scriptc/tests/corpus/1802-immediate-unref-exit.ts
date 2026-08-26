// Immediate unref semantics at loop exit: an unref'd immediate fires if
// something reffed still holds the loop through its check phase (FIFO
// with its reffed neighbors), but once ONLY unref'd immediates remain the
// loop exits and they never fire — Node's exact liveness rule, and the
// runtime releases the never-fired closure (the sanitizer lane audits
// that).
setImmediate(() => {
  console.log("unrefd neighbor fires");
}).unref();
setImmediate(() => {
  console.log("reffed fires");
  // Queued for the NEXT turn with nothing reffed left: never fires.
  setImmediate(() => {
    console.log("never");
  }).unref();
});
console.log("main done");
