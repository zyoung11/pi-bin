// Ambient namespaces (`declare namespace`) are erasable declarations with
// NO runtime object — a value read through one is Node's exact catchable
// ReferenceError at the access, the same stance as ambient `declare
// const` reads. Runs under Node's plain strip mode (declare statements
// are erasable syntax).
declare namespace Missing {
  const x: number;
  function f(): string;
  namespace Deep {
    const y: string;
  }
}

try {
  console.log(Missing.x);
} catch (e) {
  if (e instanceof Error) console.log("read:", e.name + ": " + e.message);
}

try {
  console.log(Missing.f());
} catch (e) {
  if (e instanceof Error) console.log("call:", e.name + ": " + e.message);
}

try {
  console.log(Missing.Deep.y);
} catch (e) {
  if (e instanceof Error) console.log("deep:", e.name + ": " + e.message);
}

console.log("still running");
