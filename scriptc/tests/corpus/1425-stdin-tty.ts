// The stdin slice, stream half: isTTY probes (the harness pipes stdio, so
// every stream answers non-TTY — printed through !! because Node exposes
// undefined on non-TTY streams where scriptc's boolean is false, the
// documented divergence) and destroy() as a no-op. The readFileSync(0)
// read half lives in 1426: in NODE, touching process.stdin puts fd 0 in
// non-blocking mode and a later readFileSync(0) throws EAGAIN — mixing
// the two APIs is a Node footgun, not a scriptc surface.
console.log(!!process.stdin.isTTY, !!process.stdout.isTTY, !!process.stderr.isTTY);
if (process.stdin.isTTY) {
  console.log("interactive");
} else {
  console.log("piped");
}
process.stdin.destroy();
console.log("destroyed");
