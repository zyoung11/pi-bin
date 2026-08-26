// The dead-strip counterpart: the same class-instance for-in that builds
// fine while unreached (tests/corpus/420-dead-strip-modules) fails the
// build the moment the entry path reaches it.
class Widget {
  id = 1;
}
function walk(w: Widget): void {
  for (const k in w) {
    console.log(k);
  }
}
walk(new Widget());
