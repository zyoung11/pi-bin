# Changelog

Engineering log of the pi static-compile fork. Baseline: upstream
[pi-mono](https://github.com/earendil-works/pi-mono) v0.84.3 (Node.js-based
coding agent, commit `ca13180`). Goal: compile the agent to a native Linux
binary via [scriptc](https://scriptc.dev) — no JS engine, no runtime asset
reads — and keep it fully functional.

Current state: scriptc diagnostics 712 → 0 (scriptc compiler untouched),
native binary 8.2 MB, all core features verified by real runs. Version 0.1.0.

Detailed debugging methodology lives in `pi-bin-rewrite-and-debug-guide.md`.
Round numbering in commit messages refers to that log.

---

## Phase 1 — Extension removal and schema decoupling (2026-08-27)

- `28fc460` — Static-compile plan: goals, analysis, findings, approach.
- `3500210` — Remove the extension system entirely (core/extensions,
  src/extensions, examples/extensions). Tool definitions de-extended:
  `ToolDefinition.execute` drops `ExtensionContext`; AgentSession loses event
  hooks, command interception, compaction interception, `before_agent_start`;
  bash/read tools take session context via closures. Remove the photon image
  pipeline and clipboard image paste branch; delete 29 extension/image test
  files.
- `204ebb1` — Add `pi-ai/schema` subpath export: a mini JSON Schema library
  (15 Type builders + Compile/Value/Guard), runtime-shape compatible with
  typebox 1.x byte-for-byte. Switch 16 files from typebox value imports,
  removing the SC1013 namespace re-export wall.

## Phase 2 — Own HTTP transport, remove built-in providers (2026-08-27)

- `5da9fb2` — Add `ai/src/api/openai-http.ts`: own chat-completions transport
  (fetch POST + SSE line decoding) replacing the openai SDK; error object
  shape aligned with the SDK so the retry chain stays untouched. Verified
  against a real llamacpp endpoint (print round-trip + bash tool call).
- `ae55011` — Remove all built-in providers and SDK-backed API
  implementations from pi-ai (121 files); compat.ts slimmed to
  openai-completions + faux. Checkpoint (tsgo red at this point).
- `29fd855` — Finish consumer adaptation; delete orphan OAuth flows
  (11 files), bun entry (3 files), dead build scripts; ai build scripts
  become plain tsgo.

## Phase 3 — One program graph, local schema (2026-08-27)

- `cefcb70` — Decision B: rewrite 241 cross-package bare imports in 168 files
  to relative imports pointing directly at src, merging all workspace packages
  into one scriptc program graph. Cut an SC1016 import cycle. New baseline:
  691 diagnostics.
- `1879b0d` — Rewrite `schema.ts` type layer: brand types mirrored from
  typebox 1.x as local structures; builders become a `SchemaBuilders` class
  (object-literal methods drop optional params on function values).
- `4d72130` — Break the "three walls": remove `~kind`/`~unsafe` runtime
  markers entirely, `~optional` becomes a transient wrapper unwrapped at
  Object construction. Local `Static<>` mechanism via brand generics +
  conditional ordering; 9 Eq checks against typebox all true. schema.ts
  scriptc diagnostics 99 → 0; total 712 → 614.

## Phase 4 — Replace und_lowerable npm dependencies with mini libraries (2026-08-27/28)

- `f3be31d` — Rewrite `utils/child-process.ts` (cross-spawn removed, local
  handle/stream types). Mini libraries: mini-chalk, mini-semver,
  mini-minimatch, mini-lockfile, mini-diff (byte-equal to jsdiff 8.0.4 on
  8/8 assertions), east-asian-width table, mini-hosted-git-info. http
  dispatcher drops undici. 664 → 532 diagnostics.
- `a58c276` — Local `TextSegmenter` replacing `Intl.Segmenter` (no lowering):
  UAX#29 practical subset for grapheme segmentation. 6 v-flag regexes
  eliminated.
- `0221074` — Drop highlight.js (API surface kept, degrades to plain theme
  colors); remove mermaid rendering; add mini-yaml (10/10 scenarios
  byte-equal); ignore/string_decoder/partial-json compile via --npm-static.
- `d4d775b` — Add `tui/mini-markdown.ts` replacing the marked package:
  block lexer + inline lexer, 17/17 scenarios field-equal to marked v18.
- `4b66797` — mini-ignore (gitignore subset matcher, 10/10 equivalent).
  npm-static reduced to `string_decoder,partial-json`; SC2013 cleared.
- `ceff93d` — mini partial-JSON parser (11/12 equivalent vs npm package).

## Phase 5 — Scriptc lowering grind, 712 → 0 diagnostics (2026-08-28 → 09-01)

~110 commits of mechanical + architectural fixes. Every change verified with
`tsgo --noEmit` clean and a real llamacpp run (print mode + bash tool call).
Grouped by topic:

- **Component/type architecture**: `Component` interface → abstract base
  class (60498fb); `Model<any>` → `Model<Api>` across 13 files (e1945b3);
  `AgentMessage` flattened to a 7-arm explicit union (3c4005b); mixed
  Promise/class returns unified to pure Promise (44a0ba7, 6fbf2d6, ee5e539,
  328f5f8); `void | Promise<void>` union arms eliminated globally (be8ed0a);
  `convertToLlm` unified to async (a07c906, c63d33b).
- **Set/Map/Array lowering**: `Set<AbortController>` → arrays of abort
  functions (9d11eb8, 776e738, c9b48e6, c7a6b33); `Array.from(Set/Map)` →
  loops; `Map` value Sets → string arrays (30b8a1c, f6290eb, 4d229bf).
- **session-manager** (36 diagnostics, f36ccea, b95cd9b, 0278a57): cast →
  discriminative narrowing; `Date.parse` → lexicographic; migrateV1ToV2/
  v2ToV3 rewritten; generateId reworked.
- **package-manager** (6d6c730, 24734cc): `fs.globSync` → recursive readdir +
  mini-minimatch; dynamic keyed reads → double-hop casts.
- **child-process** (97, 970ec5d): spawn option literals; Uint8Array
  listeners; WSL stdin transport dead branch removed.
- **openai-completions/openai-http** (29f22fb, c9ea868): openai npm types
  fully localized; SSE callback mode (async generators unsupported); custom
  UTF-8 tail buffering for stream decode; ProviderHttpError class; hand-written
  parseDecimalNumber/RFC1123 parse; constrained-sampling rewritten.
- **TUI internals** (db52f9d, 161cae0, b564cd8, f3b09f2, a5cefcf, abd28fe):
  tui/index.ts barrel imports → direct source imports in 58 files (dual class
  identity root cause); `new Proxy` → literal record forwarding record
  (abd28fe — key architecture finding); Terminal interface getters → methods
  across 6 files (9ae7e21); `TuiAltScreen`/`TuiMainScreen` renderer union →
  `TuiBase` base class (f3b09f2).
- **Mechanical long tail** (~40 commits): `parseInt`/`toString(radix)`/
  `replaceAll`/`Array.from`/`Object.hasOwn`/`Math.imul`/`Math.max(...)`
  spread/`fs.access`→`existsSync`/`splice(i,0,x)`/regex v-flag/RegExpExecArray
  index/process.exitCode → explicit patterns. Files: editor, keys, uuid,
  json-parse, changelog, usage-totals, tools-manager, latex, footer, git,
  provider-composer, settings, rpc-mode, interactive-mode.
- **Compiler instrumentation added** (scriptc repo, separate): SC_DEBUG_FAIL
  decomposition-tree probe (fadf41d), SC_DEBUG_WIDTH probe for record
  width-coerce failures (7d0dd29), `withUndefinedArm` DYN shortcut (e128b7c).
- Milestones: 479 all-leaf (9aa4355) → 416 first fully-visible baseline
  (08d4d2f) → 34 remaining at 99.7% (a832036) → **0 diagnostics, scriptc
  untouched** (bbfaeb3, route A complete).

## Phase 6 — Native binary runtime hardening (2026-09-01)

First native run exposed runtime semantics gaps. Fixes, each verified by real
runs:

- `9842626` — Event stream rewritten to events+cursor model (undefined values
  flowing as end markers caused traps); pending bash components re-render;
  streaming block cast-view writes (silent no-op) → fresh array + reference
  assignment.
- `ce791f2` — `--print` output loss: cast-view array push was a no-op; fixed
  via reference assignment. Signal listeners left registered → explicit
  `process.exit`.
- `c097994` — Startup chain: empty-array destructuring and missing-key reads
  guarded (typed record no-undefined rule).
- `9985dbc` — Theme color chain rebuilt with explicit key traversal (typed
  record keyed reads trap on missing keys).
- `f2858e9` — Session loader: JSON.parse results cannot be re-tagged into
  typed unions — added a revive deserializer (`reviveFileEntry`, ~380 lines)
  rebuilding every field through unknown channels.
- `45b1ffd` — TUI first-run fixes: reviver, theme chain, slot alignment,
  command trims.
- `4071b49` — `spawnProcess` optional-field undefined leak (cwd/windowsHide)
  normalized — tmux keyboard check crashed at startup.
- `fbb964a` — Markdown lookahead OOB (`tokens[i+1]` on single-token messages)
  → length guards; 9 more lookahead/lag reads hardened.
- `26bdebb` — Same root cause, ASan build pinpointed a 4-byte heap overflow in
  `Markdown_renderInlineTokens` (union switch narrowing retag outside the
  element) — loop body moved to the dyn channel.
- `8e0b8da` — Compiler bug fixed in scriptc (never → F64 mapping broke every
  tool call: "expected number"); markdown rendering pipeline fully dyn-ified;
  `/tree` empty-array OOB fixed.
- `d84522e` — All on-screen text vanished: `Token[]` parameter passing
  corrupted 13-arm union elements — signatures changed to `unknown[]`,
  callers cast; markdown pipeline now has zero typed Token union boundaries.
- `7ea3090` — read/write tool render crash: literal exact-shape record with
  variable keyed read (`extToLang[ext]`) traps when the key is absent —
  recordViewOf dyn view.
- `6791eec` — tree-selector empty-array `[0]` read; runtime traps now print a
  native backtrace (no gdb needed).
- `3fcac7f` — edit tool diff crash: `parts[parts.length-1]` on an empty array
  (mergeParts) — length guard; edit tool verified working for the first time.
- `38ae87f` — tmux pane kill incident: killProcessTree group-kill pid-reuse
  race — dual guardrails (pgrp==pid verification before group kill).
- `763bcf7`, `4f853a9` — Documented remaining double-free in the read render
  path; added the state overview + full guide document.

## Phase 7 — Tool-call OOM root fix and provider synthesis (2026-09-02)

- `c7b2104` — Tool calls crashed with `scriptc: out of memory` (SIGABRT, not
  reproducible via node). Reproduced in an isolated pane: RSS 10 MB → 222 MB
  in seconds. Two root causes fixed: (1) `processImage` discriminated-union
  return corrupted on first static execution (value not representable in
  target union); (2) renderer state writes on cast views were silent no-ops →
  `changed` always true → `context.invalidate()` infinite recursion, each
  level JSON-serializing (allocation avalanche). See round 57 log.
- `3aa651c` — Remove the /changelog command cluster; delete
  `packages/*/CHANGELOG.md`, first-run wizard (dead code: never triggers on a
  fork), "Pi documentation" injection in the system prompt; auth guidance now
  points to models.json/auth.json.
- `563947a` — Wire up the original pi API providers: provider definitions from
  `models-store.json` merged into `models.json`; deepseek/zai/xiaomi verified
  with real runs. Fixed `usage: null` in stream chunks (checked-cast rejected
  → every chunk silently dropped — deepseek/mimo returned nothing) and
  `thinkingLevelMap` null-value keyed reads (glm-5.2-highspeed trap).
- `ad00395` — Provider synthesis moved fully in memory: `ModelConfig.load`
  merges models-store.json providers (schema-checked) after models.json;
  models.json restored to user-authored content only. credentials resolve from
  auth.json by provider id.
- `1426a0e` — /settings → per-model thinking submenu crashed (missing-key
  keyed read on `modelThinkingLevels` for unconfigured models) — three reads
  moved to a dyn helper.
- `7ddd7b0` — Full audit of typed record variable keyed reads across all slash
  commands, settings submenus, and selectors: fixed three more instances
  (`getSupportedThinkingLevels` off/xhigh missing keys, `thinkingBudgetForLevel`
  off budget, SteppedSubmenu buildContext) — `--thinking off` now works.

## Phase 8 — Cleanup, theme simplification, images, version 0.1.0 (2026-09-02)

- `08a0b4d` — edit tool frame styling (double Box padding, background not
  full-width); onboarding line removed; --help aligned with actual features
  (29 dead env-var docs, --extension flags, bearer-token auth, stale examples);
  /hotkeys trimmed to supported entries.
- `3f2afc4` — Theme simplification: dark built-in + user JSON themes only
  (`~/.pi/agent/themes/*.json`, pure data). Removed: light builtin, automatic
  light/dark switching, terminal background detection cluster, first-run
  wizard (never triggers on a fork), "Pi documentation" injection in the
  system prompt, /login references. ThemeSubmenu rewritten as a flat list.
- `82f4628` — Image input: clipboard paste (wl-paste with xclip fallback,
  binary output captured via temp-file redirection), message text paths
  extracted as inline image attachments, oversized images (> 4 MB) rejected
  with an explicit error. Verified: deepseek-v4-flash-vision-exp answers
  "cloud." for a cloud photo via Ctrl+V paste, message path, and print-mode
  @file.
- `8b0723e` — Version 0.0.3 → 0.1.0.
- `303416d` — Repo cleanup: 41 MB compile artifact, upstream test launchers,
  CONTRIBUTING/SECURITY/tui-plan, 35 upstream release/stats scripts;
  package.json scripts whitelisted (check/build:native/generate:models/eval/
  test); README rewritten for the fork.
- `e92409f` — Remove packages' CHANGELOG.md (9), README.md (8), LICENSE
  files (npm-publishing artifacts) — 14k lines.
- `4c83567` — Remove all package test suites (459 files, 8.4 MB, 1795 TS
  errors, referencing long-removed features) and vitest configs. Verification
  is real-run smoke only.
- `e35c2c2` — Remove outdated package docs (extensions, containerization,
  termux, windows, first-run wizard, old screenshots) and fix dangling
  cross-references; keep 24 docs that match current functionality.
- `1bfbcd6` — AGENTS.md rewritten in English, integrating the static-compile
  rules, runtime discipline, and verification gates from the rewrite guide.

## Known limitations

- llamacpp endpoints behind the lmgo-v2 proxy fail image requests
  ("proxy error: Failed to read connection") — server-side issue, curl
  reproduces it. Use deepseek vision models for image input.
- Images over 4 MB are rejected (no resize engine in static builds); scale
  them down externally.
- The full per-round debugging narrative (crash forensics, scriptc compiler
  bugs found, probe methodology) lives in this file's
  git history and `pi-bin-rewrite-and-debug-guide.md`.
