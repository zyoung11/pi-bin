// The built dist of a workspace-internal package (what Node runs when the
// program imports the package through its workspace symlink).
const GREETING = "workspace";

export function describe(n) {
  return `${GREETING}:${n * 2}`;
}

export function tag(parts) {
  let out = "";
  for (const p of parts) out += `[${p}]`;
  return out;
}
