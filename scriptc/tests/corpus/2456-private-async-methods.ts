// Async #private methods: the body is an async IrFunction entered through its fiber spawn wrapper with `this` as param 0 — dispatch was already static for privates, so the async-method machinery composes unchanged. Await chains through private helpers, private async calling private sync AND a private generator, and interleaved instances all match Node's ordering.
class Pipeline {
  #name: string;
  #stages: string[] = [];
  constructor(name: string) {
    this.#name = name;
  }
  #stamp(s: string): string {
    this.#stages.push(s);
    return `${this.#name}.${s}`;
  }
  async #fetch(key: string): Promise<string> {
    return this.#stamp(`fetch(${key})`);
  }
  async #transform(raw: string): Promise<string> {
    const upper = raw.toUpperCase();
    return this.#stamp("transform") + ":" + upper;
  }
  *#audit(): Generator<string, void, undefined> {
    for (const s of this.#stages) yield s;
  }
  async run(key: string): Promise<string> {
    const raw = await this.#fetch(key);
    const out = await this.#transform(raw);
    let audit = "";
    for (const s of this.#audit()) audit += `[${s}]`;
    return `${out} ${audit}`;
  }
}
async function main(): Promise<void> {
  const p1 = new Pipeline("p1");
  const p2 = new Pipeline("p2");
  console.log(await p1.run("a"));
  console.log(await p2.run("b"));
  // Interleaving: both fibers started before either awaits completion.
  const [c, d] = await Promise.all([p1.run("c"), p2.run("d")]);
  console.log(c);
  console.log(d);
}
void main();
