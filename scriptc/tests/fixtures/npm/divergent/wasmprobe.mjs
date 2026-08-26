// The WebAssembly stub surface: instantiate REJECTS with the clear
// message (the real API's promise shape — invalid bytes reject, never
// throw synchronously, so eval-time compiles stay lazy exactly as under
// Node), the error classes are REAL Error subclasses (Emscripten's abort
// path constructs one), and validate() answers the feature-detection
// truth.
export async function probe() {
  try {
    await WebAssembly.instantiate(new Uint8Array(4), {});
    return "instantiated";
  } catch (e) {
    return String((e && e.message) || e);
  }
}
export function abortShape() {
  try {
    throw new Error("boom");
  } catch (e) {
    const r = new WebAssembly.RuntimeError("Aborted(" + e + ")");
    return (r instanceof Error) + "|" + r.name + "|" + r.message;
  }
}
export function validated() {
  return String(WebAssembly.validate(new Uint8Array(4)));
}
