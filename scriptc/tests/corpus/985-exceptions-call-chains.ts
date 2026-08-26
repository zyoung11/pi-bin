// Propagation through call chains and closures: exceptions cross plain
// calls, closure calls (callValue), array HOF callbacks, and generic
// function instances — every hop releasing its own frames on the way out.
let hops: string[] = [];

function level3(n: number): number {
  hops.push("l3");
  const debris = "3-" + "z".repeat(n);
  if (n > 4) {
    throw "failed at depth 3 (" + debris + ")";
  }
  return n * 2;
}

function level2(n: number): number {
  hops.push("l2");
  const held = ["two", "" + n];
  return level3(n) + held.length;
}

function level1(n: number): number {
  hops.push("l1");
  return level2(n) + 100;
}

for (const probe of [2, 9]) {
  hops = [];
  try {
    console.log("result", level1(probe), "hops", hops.join(","));
  } catch {
    console.log("chain broke, hops", hops.join(","));
  }
}

// Through closures and function values: the thrower is called indirectly.
function apply(f: (x: number) => number, x: number): number {
  return f(x);
}
const spiky = (x: number): number => {
  if (x === 13) {
    throw "unlucky";
  }
  return x + 1;
};
try {
  console.log("apply ok:", apply(spiky, 5));
  console.log("apply boom:", apply(spiky, 13));
} catch {
  console.log("indirect throw caught");
}

// A capture-heavy closure that throws: its boxes unwind cleanly.
function counterFactory(limit: number): () => number {
  let count = 0;
  const tag = "cap-" + limit;
  return (): number => {
    count = count + 1;
    if (count > limit) {
      throw tag + " exhausted";
    }
    return count;
  };
}
const tick = counterFactory(2);
try {
  console.log(tick(), tick(), tick());
} catch {
  console.log("counter blew up");
}

// Array HOF callbacks that throw: map/filter/forEach propagate mid-loop.
const data = [1, 2, 3, 4, 5];
try {
  const doubled = data.map((x: number): number => {
    if (x === 4) {
      throw "map hit " + x;
    }
    return x * 2;
  });
  console.log(doubled.join(","));
} catch {
  console.log("map aborted");
}
let seen = 0;
try {
  data.forEach((x: number): void => {
    seen = seen + 1;
    if (x === 3) {
      throw "forEach hit " + x;
    }
  });
} catch {
  console.log("forEach aborted after", seen);
}
console.log(
  "filter kept:",
  data
    .filter((x: number): boolean => {
      return x % 2 === 1;
    })
    .join("+"),
);

// Through a generic instance.
function pipe<T>(value: T, f: (v: T) => T): T {
  return f(f(value));
}
try {
  console.log(
    pipe("seed", (s: string): string => {
      if (s.length > 6) {
        throw "generic overflow: " + s;
      }
      return s + "!!";
    }),
  );
} catch {
  console.log("generic pipe caught");
}
