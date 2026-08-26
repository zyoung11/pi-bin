// Definite-assignment fields assigned past the constructor's top level (the Output.initialize idiom): the slot rides an undefined-armed union internally — allocation writes undefined, writes wrap, reads checked-extract the declared type — so the class lowers and behaves exactly like Node on every assigned-before-read path.
interface Opts {
  stream?: string;
  debug?: boolean;
  width?: number;
}
class Output {
  stream!: string;
  debugEnabled!: boolean;
  width!: number;
  spinnerMessage: string;
  constructor(stream: string, options: Opts = {}) {
    this.spinnerMessage = "";
    this.initialize({ ...options, stream });
  }
  initialize({ stream, debug, width }: Opts = {}) {
    if (stream !== undefined) this.stream = stream;
    if (debug !== undefined) this.debugEnabled = debug;
    if (width !== undefined) this.width = width;
  }
  print(msg: string): void {
    // An unassigned bool! field is falsy exactly like Node's undefined —
    // conditions are the exact surface (raw printing would show the
    // divergence SEMANTICS.md documents: false where Node says undefined).
    console.log(`[${this.stream}:${this.width}] ${msg}`, this.debugEnabled ? "debug" : "quiet");
  }
}
const o = new Output("stdout", { debug: true, width: 80 });
o.print("hello");
o.initialize({ debug: false, width: 120 });
o.print("again");
o.stream = "stderr";
o.print("switched");
class Sub extends Output {
  label = "sub";
  show(): void {
    console.log(this.label, this.stream, this.width + 1);
  }
}
const s = new Sub("tty", { width: 9 });
s.show();
s.print("from sub");
