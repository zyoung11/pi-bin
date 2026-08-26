// The fences around optional fields. Optional fields themselves compile —
// record fields AND class fields (undefined-armed union slots; corpus 967
// and 2047) — and `{a: string}` values COERCE into `{a?: string}` slots
// (the width-copy field lift). What stays rejected: BARE undefined-armed
// unions still can't stringify (record FIELDS get Node's drop treatment;
// the CAST direction compiles now — the checked-dynamic tree holds a first-class undefined
// value).

function mkMaybe(): string | undefined {
  return undefined;
}
const stringifyBare = JSON.stringify(mkMaybe());
