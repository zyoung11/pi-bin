// Mixed-operand logical ops in VALUE position: `value || null`,
// `flag || undefined`, `n || null` — plain operands whose result the
// checker types as one union (the portless marker-file and option-object
// idioms). Short-circuit evaluation order stays JS-exact.
function readMarker(raw: string): string | null {
  const value = raw.trim();
  return value || null;
}
const hit = readMarker("  10.0.0.7 ");
console.log(hit !== null ? hit : "<null>");
console.log(readMarker("   ") === null);

let wants = false;
wants = "x".length > 1;
const funnel: boolean | undefined = wants || undefined;
console.log(funnel === undefined);
wants = "xy".length > 1;
const funnel2: boolean | undefined = wants || undefined;
console.log(funnel2 === undefined, funnel2 === true);

const zero = "".length;
const port: number | null = zero || null;
console.log(port === null);
const seven = "1234567".length;
const port2: number | null = seven || null;
console.log(port2 !== null ? port2 : -1);

// && with a unit arm: value semantics through the union result.
const name: string | undefined = "x".length > 0 ? "web" : undefined;
const label: string | undefined = name && name.toUpperCase();
console.log(label !== undefined ? label : "<none>");

// The deciding operand's SIDE comes out through chained picks.
const chosen = readMarker("") || readMarker(" lan ") || "default";
console.log(chosen);
console.log(readMarker("") || "fallback");
