// Promise.all lowers over ONE promise type (any Promise<T>[] expression);
// heterogeneous array literals land on the checker's tuple overload and
// fence with the annotate hint, non-array arguments fence on their shape,
// and allSettled/any stay fenced.
async function hetero(): Promise<void> {
  const pair = await Promise.all([
    new Promise<string>((resolve) => resolve("s")),
    new Promise<number>((resolve) => resolve(1)),
  ]);
  console.log(pair.length);
}
async function settled(): Promise<void> {
  const one = new Promise<number>((resolve) => resolve(1));
  await Promise.allSettled([one]);
}
hetero();
settled();
