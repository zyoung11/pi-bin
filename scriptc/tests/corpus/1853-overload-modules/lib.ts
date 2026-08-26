// Exported overloaded function: the signatures and the implementation
// share one symbol, so importers resolve to the same FnSig the local
// call sites use.
export function render(v: string): string;
export function render(v: number): string;
export function render(v: string | number): string {
  return typeof v === "string" ? "<" + v + ">" : "#" + String(v);
}

// Overloads inside an instantiated namespace: hoisted under the qualified
// name like any namespace function; the signatures still lower to nothing.
export namespace Fmt {
  export function tag(name: string): string;
  export function tag(name: string, body: string): string;
  export function tag(name: string, body?: string): string {
    return body === undefined ? "[" + name + "]" : "[" + name + ":" + body + "]";
  }
}
