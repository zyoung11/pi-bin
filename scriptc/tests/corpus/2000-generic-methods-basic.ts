// Generic METHODS (own type parameters) monomorphize per call site like
// top-level generic functions: one compiled instance per resolved
// signature, direct static dispatch, `this` as param 0.
class Toolkit {
  tag = "tk";
  echo<T>(x: T): T {
    return x;
  }
  pair<A, B>(a: A, b: B): string {
    return `${this.tag}(${String(a)},${String(b)})`;
  }
  // Explicit type arguments, inference, and defaults all resolve through
  // the checker's signature.
  wrap<T = number>(n: number): string {
    return `w${n}`;
  }
  // Optional/default/rest parameters complete exactly like generic
  // functions (the one-signature contract).
  sum<T>(label: T, head: number, ...rest: number[]): string {
    let s = head;
    for (const r of rest) s += r;
    return `${String(label)}=${s}`;
  }
  dflt<T>(x: T, times: number = 2): string {
    return String(x).repeat(times);
  }
  // A generic method calling ANOTHER generic method and a generic
  // function: instances queue instances to the joint fixpoint.
  both<T>(x: T): string {
    return `${String(this.echo(x))}/${idf("f")}`;
  }
  // Same-key recursion converges by reusing its own instance.
  down<T>(x: T, n: number): T {
    if (n <= 0) return x;
    return this.down(x, n - 1);
  }
}
function idf<T>(x: T): T {
  return x;
}

const t = new Toolkit();
console.log(t.echo(41) + 1);
console.log(t.echo("hi").toUpperCase());
console.log(t.echo<string>("explicit"));
console.log(t.echo([1, 2, 3]).length);
console.log(t.pair(1, "x"));
console.log(t.pair("y", false));
console.log(t.wrap(7));
console.log(t.sum("s", 1, 2, 3));
console.log(t.sum(true, 10));
console.log(t.dflt("ab"));
console.log(t.dflt("c", 4));
console.log(t.both(5));
console.log(t.down("end", 3));

// Two call sites with one resolved signature share one instance — behavior
// is observable only through correctness, but both spellings must agree.
console.log(t.echo(1.5), t.echo(2.5));
