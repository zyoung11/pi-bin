// Fields assigned on only SOME constructor paths: the skipped branch
// leaves them undefined — Node defines every declared field (as undefined)
// before the constructor body runs, so the untaken branch is not garbage,
// it is a first-class undefined the program can observe.
class Conf {
  mode: string | undefined;
  level: number | undefined;
  extra: string | undefined; // assigned on NO path
  constructor(verbose: boolean) {
    if (verbose) {
      this.mode = "verbose";
      this.level = 2;
    }
  }
}

for (const flag of [false, true]) {
  const conf = new Conf(flag);
  console.log(String(conf.mode), conf.level ?? 0, conf.mode === undefined);
  console.log(conf.extra ?? "never-set", conf.extra === undefined);
}
