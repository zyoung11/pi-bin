export let inits: string = "";
export function record(tag: string): void {
  inits += tag;
}
console.log("init shared");
record("s");
