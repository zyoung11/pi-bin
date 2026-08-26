// setTimeout handles: clearTimeout cancels, .unref() drops the timer from
// the loop's keep-alive set (the process exits without firing it — Node's
// rule), and handles ride `Timeout | null`-style unions through truthiness
// narrowing.
let debounce: ReturnType<typeof setTimeout> | null = null;
debounce = setTimeout(() => {
  console.log("debounced fire");
}, 30);

// Re-arm: clear the pending one (narrowed out of `Timeout | null`) and
// schedule a fresh one, the debounce pattern.
if (debounce) clearTimeout(debounce);
debounce = setTimeout(() => {
  console.log("debounced fire 2");
}, 30);

// A cleared timer never fires.
const dead = setTimeout(() => {
  console.log("SHOULD NOT PRINT (cleared)");
}, 40);
clearTimeout(dead);

// An unref'd LONG timer does not keep the process alive: the program ends
// after the short refd timer fires, without waiting 5 seconds.
setTimeout(() => {
  console.log("SHOULD NOT PRINT (unrefd)");
}, 5000).unref();

// unref through a stored handle.
const stored = setTimeout(() => {
  console.log("SHOULD NOT PRINT (stored unrefd)");
}, 5000);
stored.unref();

// The defensive optional-call spelling (mdns's timer.unref?.()).
const guarded = setTimeout(() => {
  console.log("SHOULD NOT PRINT (guarded unrefd)");
}, 5000);
guarded.unref?.();

// An unref'd timer STILL fires when the loop is alive anyway and its
// deadline passes first.
setTimeout(() => {
  console.log("early unrefd fires");
}, 10).unref();

// hasRef reflects the state, and ref() puts a timer back on the clock.
const reffed = setTimeout(() => {
  console.log("re-reffed fires");
}, 15);
reffed.unref();
console.log("hasRef after unref:", reffed.hasRef());
reffed.ref();
console.log("hasRef after ref:", reffed.hasRef());

console.log("scheduled");
