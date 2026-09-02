# Development Rules

## Project Overview

This is a static fork of [pi-mono](https://github.com/earendil-works/pi-mono): the
pi coding agent compiled to a native Linux binary via
[scriptc](https://scriptc.dev) — no JS engine, no runtime asset reads.

- Main entry: `packages/coding-agent/src/cli.ts`; the built binary is `./pi`.
- Deeper references live outside this repo: `../docs/CHANGELOG.md` (engineering
  log, one entry per commit) and `../docs/pi-bin-rewrite-and-debug-guide.md`
  (full rewrite/debug guide). Read them when a change touches scriptc-sensitive
  code or when debugging.
- Config dir env var is `PI_CODING_AGENT_DIR` (NOT `PI_AGENT_DIR`); default
  `~/.pi/agent`. Models: `models.json` plus providers synthesized in memory from
  `models-store.json`; API keys from `auth.json`; custom themes from `themes/*.json`.

## Conversational Style

- Keep answers short and concise
- No emojis in commits, issues, PR comments, or code
- No fluff or cheerful filler text
- Technical prose only, be direct
- Use concise, clear, simple language. Define unavoidable jargon before using it.
- Explain non-trivial designs and problems as: problem, concrete example or short trace, then solution.
- When the user asks a question, answer it first before making edits or running implementation commands.
- When responding to user feedback or an analysis, explicitly say whether you agree or disagree before saying what you changed.

## Code Quality

- Read files in full before wide-ranging changes, before editing files you have not fully inspected, and when asked to investigate or audit. Do not rely on search snippets for broad changes.
- No `any` unless absolutely necessary.
- Inline single-line helpers that have only one call site.
- **No inline imports** (`await import()`, `import("pkg").Type`). Top-level imports only.
- Use only erasable TypeScript syntax (Node strip-only mode) in `packages/*/src`: no parameter properties, `enum`, `namespace`/`module`, `import =`, `export =`. Use explicit fields with constructor assignments.
- Always ask before removing functionality or code that appears intentional.
- Do not preserve backward compatibility unless the user asks for it.
- Never hardcode key checks (e.g. `matchesKey(keyData, "ctrl+x")`). Add defaults to `DEFAULT_EDITOR_KEYBINDINGS` or `DEFAULT_APP_KEYBINDINGS` so they stay configurable.
- There is no unit-test suite (removed: it had drifted far from src). Verification is real-run smoke in an isolated terminal (see Verification below). Do not reintroduce vitest/jest.
- After a significant fix or feature round, record findings in `../docs/CHANGELOG.md`.

## Static Compilation Constraints (scriptc)

Everything in `packages/*/src` must compile through scriptc to native code. The
scriptc lowering is narrower than TypeScript; these are hard rules, each backed by
a confirmed runtime bug:

- **Imports**: direct relative imports to source files (`../foo/bar.ts`); never
  barrel/`index.ts` imports (dual class identity); never namespace re-exports;
  type-only imports must be marked `type` (runtime verification of value imports).
- **No dynamic constructs**: no `new Function`, no computed method names, no
  Symbol-keyed protocol properties — use plain methods and discriminator fields.
- **Classes consumed across record boundaries**: no getters (use methods), no
  intersection types, no `any`/`unknown`/function-typed fields where a record
  shape is expected. Prefer flat interfaces over discriminated unions at dynamic
  data boundaries.
- **Unions**: all arms must share identical field types (including `| undefined`
  arms); no `void` arms; no union-typed function returns for JSON-shaped results
  (use a flat interface — union return re-tagging corrupts values).
- **No `new Set(iterable)`**, no `execFileSync` with non-utf8 `encoding`, no
  `JSON.stringify` of `unknown`-typed values — these have no lowering. Capture
  binary subprocess output by redirecting to a temp file and `readFileSync` it.
- **Empty array literals** in union/record contexts need explicit `as T[]`.
- Spread only at the head of a literal; no spread-after-explicit.

## Runtime Discipline (compiles ≠ runs correctly)

The static runtime traps where JS returns `undefined`. Each rule below is backed
by a confirmed crash:

- **Missing keyed read = trap.** Reading `record[key]` where `key` is absent on a
  typed record traps ("record has no key"). `??` and `?.` do NOT protect — the
  trap fires before they evaluate. Reads over JSON/external/optional-key data go
  through a dyn helper:
  ```ts
  function recordViewOf(value: unknown): Record<string, unknown> {
      return value as Record<string, unknown>;
  }
  function lookupX(map: unknown, key: string): string | undefined {
      const value = recordViewOf(map)[key];
      return typeof value === "string" ? value : undefined;
  }
  ```
- **Cast views**: `value as SomeInterface` / `recordViewOf(x)` produce a
  materialized COPY — reads are correct, writes and deletes are silently lost.
  Writes must go through a function that takes a `Record<string, unknown>`
  parameter (parameter passing is by reference — writes reach the original) or
  through a field chain on a real object (`holder.payload["key"] = v`).
- **Array bounds**: `[i+1]` lookahead, `[length-1]` on empty arrays, and `[0]` on
  empty arrays all trap. `?.` does not protect. Guard with a length check first.
- **Large unions (10+ arms)**: never pass typed union arrays as parameters (element
  re-tag corrupts); signatures take `unknown[]` and read via `recordViewOf`.
  Typed `switch` narrowing on union elements writes a retag outside the element —
  dispatch with an if-chain over a dyn-read discriminator instead.
- **`for (const x of arr)` with `await` inside runs only the first iteration** —
  collect into an array, then dispatch with an index `while` loop.
- **`undefined as T` writes** into a string/number-valued record corrupt it — use
  `delete record[key]` or write a real value.
- **Functions returning plain strings** that flow through theme/link helpers may
  carry OSC/hyperlink escapes; do not assume `.length` equals visible width
  (use `visibleWidth`).

## Verification (three gates, all required after every change)

1. `npm run check` — biome + `tsgo --noEmit`. Must be clean for `packages/*/src`.
2. Static build: `npm run build:native` (scriptc, requires Node 24+ at
   `~/bin-node26` in PATH; output `./pi`). Zero diagnostics required.
3. Real-run smoke in an ISOLATED tmux session:
   ```bash
   tmux new-session -d -s smoke -x 180 -y 45 -c <repo>/pi \
       "PI_CODING_AGENT_DIR=<tmpdir> ./pi --no-session --model <model>"
   tmux send-keys -t smoke "prompt" Enter
   tmux capture-pane -t smoke -p
   tmux kill-session -t smoke
   ```
   Cover: conversation round-trip, at least one tool call, and the settings/
   selector surfaces touched by the change. Isolation requires
   `PI_CODING_AGENT_DIR` (pointing at a temp dir seeded with `models.json`,
   `models-store.json`, `auth.json`) — plain `PI_AGENT_DIR` does nothing.

Debugging tools: `PI_DEBUG_REQ=1` dumps the request body, `PI_DEBUG_SSE=1` prints
dropped SSE payloads (PARSE-FAIL), scriptc traps print a native backtrace,
`--sanitize` builds an ASan binary for heap corruption, `journalctl -k` separates
kernel OOM kills from scriptc aborts. See the guide in `../docs/` for the full
debugging playbook.

## Dependency and Install Security

- Treat npm dep and lockfile changes as reviewed code. Direct external deps stay pinned to exact versions.
- Hydrate/update locally with `npm install --ignore-scripts`; don't run lifecycle scripts unless the user asks.
- If dep metadata changes, refresh `package-lock.json` with `npm install --package-lock-only --ignore-scripts`.

## Git

Only one session works in this cwd at a time now, but keep the staging discipline:

- Stage explicit paths (`git add <path1> <path2>`); prefer `git add -A` only when
  you have verified every changed file is yours.
- Message format: first line `feat:`, `fix:`, `refactor:`, `chore:`, or `doc:`,
  followed by bullet lines (`- change one`, `- change two`). Message is
  informative and concise; include a `doc:` bullet when `../docs/CHANGELOG.md`
  was updated.
- Never run: `git reset --hard`, `git checkout .`, `git clean -fd`, `git stash`,
  `git commit --no-verify`.

## User Override

If the user's instructions conflict with any rule in this document, ask for
explicit confirmation before overriding. Only then execute their instructions.
