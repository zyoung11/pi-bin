// The checker's awaited-type form: an async function's return position types
// a returned object literal `T | PromiseLike<T>` (the lib's await-unwrapping
// contract). The literal must build as the awaited T — including fields the
// literal's own type narrows away (`lanIp: null` against `string | null`).
async function pick(flag: boolean): Promise<{ port: number; lanIp: string | null; tlds: string[] }> {
  if (flag) {
    const lanIp: string | null = "192.168.1.10";
    return { port: 8080, lanIp, tlds: ["local"] };
  }
  return { port: 80, lanIp: null, tlds: [] };
}

async function main(): Promise<void> {
  const a = await pick(true);
  const b = await pick(false);
  console.log(a.port, a.lanIp ?? "(null)", a.tlds.length);
  console.log(b.port, b.lanIp ?? "(null)", b.tlds.length);
}
main();
