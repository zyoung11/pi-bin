# Changelog

Engineering log of the pi-bin fork. Baseline: upstream [pi-mono](https://github.com/earendil-works/pi-mono) v0.84.3

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

## Phase 2 — Own HTTP transport, remove built-in providers

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

## Phase 4 — Replace und_lowerable npm dependencies with mini libraries

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

## Phase 5 — Scriptc lowering grind, 712 → 0 diagnostics

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

## Phase 6 — Native binary runtime hardening

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

## Phase 7 — Tool-call OOM root fix and provider synthesis

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

## Phase 8 — Cleanup, theme simplification, images, version 0.1.0

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

## Phase 9 — Streaming event and timeout fixes (pending commit)

Root cause shared by Bug A and Bug B: in scriptc, a record field holding an
array (`output.content = blocks`) is a value snapshot, not a reference. The
openai-completions transport assigned `output.content = blocks` once at
request start (empty array), so every downstream reader of
`event.partial.content` saw the empty snapshot until the finish-stage
reassignment. Probes confirmed: `content.length` read 0 during
text_start/text_delta and 1 only at text_end (24 chars). Fixes:

- openai-completions: reassign `output.content = blocks` after every block
  push (ensureTextBlock / ensureThinkingBlock / ensureToolCallBlock), so
  downstream sees live content. faux provider already used the safe pattern.
- json-event: `toolcall_start` no longer reverse-reads `event.partial` —
  the event now carries `id`/`toolName` directly (types.ts arm extended,
  openai-completions/faux/proxy fill them). Removes the JSON-mode trap on
  tool calls; removed the recordOf(JSON round-trip) helper.
- agent-loop: `message_update` emits `message: partialMessage` by reference
  instead of a spread copy (spread snapshot contributed to the same
  empty-content picture at TUI consumers).

Other fixes verified with mock SSE endpoints (drip/stall/tool-call/thinking):

- openai-http: `timeoutMs` was an absolute request timer (default 300 s)
  killing long generations mid-stream with "This operation was aborted".
  Now an idle timer re-armed on every chunk (undici bodyTimeout semantics),
  cleared in `finally`, with an explicit "Request idle timeout: no data
  received for Ns" error instead of the opaque DOMException message.
- editor: `expandPasteMarkers` used a literal `[paste #N]` split after
  2f2556b removed the dynamic RegExp, but inserted markers always carry a
  suffix (`+X lines`/`X chars`), so expansion silently never matched and
  sent the placeholder to the model. Replaced with a manual scanner handling
  both marker forms, matching the upstream editor semantics (the upstream
  implementation uses a dynamic RegExp that scriptc cannot lower). The
  fold-on-paste behavior is unchanged from upstream (> 10 lines or
  > 1000 chars becomes a marker; short pastes insert verbatim).
- openai-http: dialect reasoning fields (`reasoning_content`, `reasoning`,
  `reasoning_text`) added to `ChatCompletionChunkDelta` — undeclared fields
  are dropped by scriptc cast copies, so thinking blocks were never created
  from OpenAI-compatible endpoints. TUI now streams and persists thinking.

Verified: TUI frames show incremental text/thinking during streaming (was
spinner-only for the whole stream); JSON mode full tool-call round trip
(toolcall_start event, bash execution, second-turn reply); 20-line paste
folds to a marker in the editor and expands to the full 150-char payload on
submit; short paste inserts verbatim; idle-timeout fires
with a clear error and does not fire during active streaming.


## Phase 10 — /login, /logout, provider catalog, and runtime hardening (0.1.7 → 0.1.9)

Session and model-selection crashes:

- `aa513df` — `pi -c` crashed with SIGABRT whenever the sessions dir had no
  top-level .jsonl (the normal per-project layout): findMostRecentSession read
  files[0] on an empty array, and scriptc traps before `?.` can guard. Same
  guard added for empty session files opened via -c/-s. Node returned
  undefined, so upstream never hit this.
- `6e0325c` — picking a model without a modelThinkingLevels entry (first
  pick of a new model via /model) crashed with the scriptc missing-key trap;
  getModelThinkingLevel indexed the settings record directly. Reads over
  external settings JSON now go through the dyn record view; same hardening
  applied to the three modelThinkingLevels lookups in model-resolver.

Bash tool abort and environment:

- `0947d28` — Esc could not interrupt running commands, and orphaned children
  kept stealing the TTY input (sudo password prompts leaked onto the TUI,
  input felt frozen). Three stacked causes: spawnProcess silently dropped the
  detached option; processGroupId parsed /proc/pid/stat with an off-by-one
  (returned ppid, not pgrp) so the pid-reuse guard rejected every group kill;
  and killProcessTree returned silently instead of falling back to a
  single-pid kill. With detached fixed, sudo/password prompts fail fast with
  a pipe-visible error instead of hanging the TUI.
- `475bb7d` — bash tool commands run with LC_MESSAGES=C: command errors and
  prompts are English regardless of the host locale (message language only;
  file-name encoding and other locale categories unchanged).

Streaming render:

- `c3fd5b2` — every non-BMP character (emoji) rendered as two U+FFFD
  replacement chars: the mini-markdown lexer fallback walked the text one
  UTF-16 code unit at a time, splitting surrogate pairs into lone surrogates
  that fail UTF-8 encoding on output. Surrogate pairs now walk as one
  character. Upstream is unaffected (real marked package).
- `695b8b9` — streaming render crashed when a latex command was cut mid-name
  by a streaming chunk: renderLatex looked truncated commands up in typed
  lookup tables (SYMBOLS, ACCENTS, NEGATED_SYMBOLS, ...) whose dynamic keys
  scriptc materializes as fixed slots. All dynamic table reads now go through
  the dyn record view with typeof-string narrowing.

/login, /logout, and the provider catalog:

- `755a022` `ee330db` `0f078d6` `41b9127` — /login for API-key providers,
  styled and sequenced after the upstream oauth-selector flow: provider list
  with fuzzy search and configured-status marks, secret API key prompt via the
  upstream login dialog, credential persisted to auth.json through the
  provider's own login method, then the upstream post-login flow (default
  model auto-selection, status messages naming the auth.json path,
  per-provider catalog refresh).
- `0f078d6` — the provider list never depends on models-store.json contents:
  a static catalog (23 API-key providers, 642 models, generated from the
  upstream model directory) ships inside the binary. Selecting a provider
  registers it into ModelRuntime on the spot, and its catalog block is
  persisted into models-store.json after the key is saved, so /model lists it
  immediately without a restart. Startup background refresh updates providers
  with a stored key against models.dev, silently skipped offline or on
  failure.
- `c6fb4cc` — /logout: lists credentials stored by /login and removes the
  selected provider's auth.json entry (upstream logout selector flow).
- `234f85b` — deduplicated the provider list (catalog entries appeared twice:
  static list plus dynamic getProviders) and switched to upstream display
  names (Xiaomi, DeepSeek, Z.AI, ...).
- provider-composer: modelFromJson no longer casts an undefined compat into
  the 4-arm compat union (the Phase 9 "known issue" is fixed — catalog
  definitions without compat compose fine); applyExtension guards the
  empty-baseModels first-match fallback (scriptc traps on models[0] of an
  empty array); registerProvider snapshot update avoids Set/Map(iterable)
  construction.

Other:

- `475bb7d`-era follow-up — /login and /logout registered in
  BUILTIN_SLASH_COMMANDS (the handlers existed but the commands were
  undiscoverable from slash autocomplete).
- README rewritten: provider login via /login replaces the models.json
  configuration walkthrough; OAuth/subscription flows and Anthropic-wire
  providers documented as not supported yet.
- Version 0.1.6 → 0.1.7 → 0.1.8 → 0.1.9.

## Phase 11 — Startup and interaction latency (3.9MB session profiled)

- `32edec9` — Guard empty message arrays in
  `getMessageFromEntryForCompaction`: `sessionEntryToContextMessages` returns
  zero entries for non-message entries, and the unguarded `[0]` aborted the
  process (scriptc array-bounds trap) the moment auto-compaction fired on a
  large session.
- `eb5e66e` — Keep markdown render caches across tree invalidation. Profiled
  with `PI_TIMING=1` on a 3.9MB / 2285-entry / 31422-line session: session
  restore is 650ms; the cost was a single `ui.renderNow()` re-parsing every
  transcript message (~17.6s) and, per keystroke, another full re-parse caused
  by global invalidate() cascading into message components that destructively
  rebuilt all Markdown children. `Markdown.invalidate` is now a no-op with
  cache validity keyed on (text, width, markdownRenderEpoch); the seven message
  component invalidate overrides no longer rebuild children;
  InteractiveThemeController bumps the epoch on theme activation so switches
  still re-render colors. Keystroke echo drops from 17.6s to 26-193ms; theme
  switch re-renders correctly; streaming round-trip intact.
- Open: first paint on an uncompacted multi-MB session still parses the whole
  transcript synchronously (~24s before interactive). Progressive newest-first
  transcript build or viewport virtualization is the follow-up.

## Phase 12 — Progressive transcript load (Plan A)

- `599ab52` — Progressive initial transcript load: `renderInitialMessages`
  paints only the newest ~1.5 screens synchronously (interactive in ~0.4s on a
  3.9MB / 2285-entry / 30k-line session, was 24s) while older history rebuilds
  one item per event-loop tick into an unmounted `historyContainer` that mounts
  before `chatContainer` with a single full repaint at fill end. Components are
  primed (rendered once at the current width) inside the fill tick — without
  priming the fill-end walk re-parsed the whole transcript in one 17s atomic
  block. Fill is generation-guarded, cancelled by `stop()`, and tail cuts land
  only on user-message items so tool call/result pairs never split.
- `d9463a8` — `MemoContainer` for the transcript history: memoizes rendered
  lines keyed on width, dropped on child-list changes and invalidate. Post-fill
  keystroke echo drops from ~200ms (full dynamic-engine walk per repaint) to
  ~140ms including the 30k-line diff; small sessions unchanged (~26ms).
  Settings sweeps cover history children and expire the memo.
- PI_TIMING probes added: per-item fill times >200ms, fill progress, event-loop
  lag monitor, doRender renderTree timing >300ms.
- Open: the fill-end mount repaint costs ~10s once per session open
  (renderTree 4.7s warm walk + ~5s per-line phases and 30k-line rewrite);
  next levers are per-component line caches (walk degrades to concat) and
  fast paths in the per-line post-processing.
- Version 0.1.9 → 0.2.0.

## Phase 13 — Streaming frame cost and the dynamic-engine concat wall

- `356e211` — Root-caused the streaming stutter and input lag: the event-loop
  probe showed streaming frames at ~140ms regardless of the streaming-update
  throttle, pointing at `Container.render`, where every line of every child was
  pushed one-by-one through the dynamic engine (~90µs/line — a 30k-line frame
  cost 4.7s, a 1.6k-line streaming frame ~140ms). Replaced the per-line loop
  with native `concat` (one call per child): streaming frames under 80ms
  (mostly 10-20ms), fill-end mount repaint 4.8s → 254ms. Also throttled
  streaming `updateContent` to one re-render per 150ms (handler cost is ~0ms;
  the cost lands on the frame's cold markdown children), final `message_end`
  flushes immediately.
- Diagnostic takeaway: scriptc dynamic-engine per-element operations cost
  ~90µs — per-line loops over large arrays must use native `concat`, never
  per-line `push`, in any hot render path.
- `81dd061` — Known issue from Phase 12 resolved: the fill-end mount repaint
  (~10s once per session open) eliminated. coverThrough folds components into
  the history memo continuously during the fill (holding back only unresolved
  tool calls as a trailing suffix), the items-exhausted phase folds held-back
  components in bounded slices, and `finishInitialFill` no longer calls
  `ui.invalidate()` (it dropped the warm memo right before the mount paint).
  fullRender gained an image-free fast path writing one native join instead of
  60k per-line dynamic appends. Worst main-thread block during startup+fill:
  ~10s → 542ms.
- Version 0.2.0 → 0.2.1.
- Version 0.2.1 → 0.2.2.

## Phase 14 — ESC-during-bash hang (scriptc rejection identity) and the stale pending-box row

- ESC during a bash tool run no longer killed the session (global
  unhandledRejection handler), but the run then hung forever: the bash tool
  aborted correctly ("Command aborted", box turned red), the follow-up LLM call
  raced the aborted signal in `resolveProviderAuth`, and `lazyStream`'s catch
  guard `if (!(caughtError instanceof Error)) return` silently swallowed the
  rejection — the outer `AssistantMessageEventStream` never ended, the agent
  loop's `next()` awaited forever, the spinner stayed "Working..." and every
  new message queued as steering. Ground truth probe compiled with scriptc:
  an abort-originated rejection reason (Signal.reason) loses its
  `instanceof Error` identity when read directly on a `.catch(onRejected)`
  binding, while the same value forwarded through a function parameter keeps
  it; plain `new Error` rejections keep it everywhere. Fix: `lazyStream`'s
  catch now settles the stream for every rejection value (abort detections
  read `error.name === "AbortError"` at parameter position, where identity
  survives, and map to `stopReason: "aborted"` so the UI shows "Operation
  aborted" instead of "Error: ..."), and the `agentLoop`/`agentLoopContinue`
  EventStream wrappers gained a `.catch` that ends the stream with an
  `agent_end` so a loop rejection can never leave consumers pending.
- Stale row artifact fixed: after the abort the red error box kept one
  pending-colored (black) row on screen. The frame diff content was correct
  (verified with byte-level dumps of `doRender`), but the repaint moves the
  cursor relative to a tracked row that had drifted from the terminal's real
  cursor (persistent +1 screen offset established at startup, pending-wrap
  after full-width box rows), so the abort frame's writes landed one row low
  and the old pending row was never repainted; reproduced identically under
  Node (upstream-derived logic, not scriptc-specific). Fix: interactive mode
  forces a full redraw (`requestRenderForce(true)`) when a tool execution ends
  with an error or when `message_end` carries an aborted/error stop reason —
  rare events, so the full-frame cost is negligible.
- Stray unhandled rejection eliminated (was printing
  `[unhandled-rejection] AbortError: This operation was aborted` into the
  TUI after every abort): the eight `race*WithAbort` fast paths in
  `ai/src/utils/abort.ts` returned `Promise.reject(abortReason(signal))` while
  discarding the already-invoked operation promise, whose later rejection
  (the same abort propagating through its own awaits) then had no handler.
  Each fast path now observes the abandoned operation via
  `void operation.catch(() => {})` before rejecting — mirroring the existing
  pattern in `coding-agent/src/utils/abort.ts`. The global
  `unhandledRejection` handler in `main.ts` also stopped writing to stderr
  (stderr shares the terminal with the TUI and garbled the frame); it now
  appends to `/tmp/pi-unhandled-rejections.log` (with the stack when
  `PI_DEBUG_URJ=1`). Verified: the rejection log stays empty across an ESC
  abort and the TUI is untouched.
- Edit-tool error results rendered their error message twice: the styled
  in-box line (from the call preview's error) plus a plain gray duplicate.
  Root cause: the edit tool's `renderResult` threw at runtime under scriptc
  (`TypeError: expected object | undefined at $, got object` — a record value
  cast to a `X | undefined` union across the dyn-record boundary fails the
  union validation), and `ToolExecutionComponent.updateDisplay` silently fell
  back to plain-text rendering of the result. Fix: `editDetailsOf` now
  rebuilds the details object field-by-field behind a flat interface instead
  of a union cast; `bashDetailsOf` and `readDetailsOf` had the same latent
  `as X | undefined` pattern and got the same treatment (their success-with-
  truncation-details path would hit it). Error text now renders once.
- Styled edit-error rendering aligned with upstream (verified line-by-line
  against the official renderer via a deterministic render harness covering
  preview-error + execute-error and schema-validation scenarios):
  (a) the edit/bash/read renderResult still threw when details was undefined
  — the flat-interface rebuilds now guard the undefined/null case, so failed
  edits render their message through the real result renderer (red fg) and
  the gray toolOutput fallback duplicate is gone;
  (b) ToolExecutionComponent no longer installs the pending/error background
  on the self-render container (upstream's is a background-less Container):
  the red background now comes only from the edit call header via
  getEditHeaderBg, and renderCall derives settledError from the live result
  state (context.isError) so the header turns red in the same frame instead
  of one repaint later.
- Emoji input in the editor rendered as `��`: two scriptc runtime string
  semantics verified by probe — (a) single-code-unit indexing (`remaining[0]`)
  normalizes lone surrogates to U+FFFD, so StdinBuffer's per-character split
  of non-escape input broke every astral-plane character (Array.from iterates
  by code point and has a lowering; non-ASCII input now splits by code
  point); (b) TextDecoder.decode has no streaming mode, so a multi-byte
  sequence split across stdin chunks decoded to U+FFFD per chunk —
  ProcessTerminal now buffers trailing incomplete UTF-8 bytes and prepends
  them to the next chunk before decoding. Verified in the binary: emoji type
  into the editor, render correctly, survive backspace as whole code points,
  and reach the model intact; split-chunk decode unit-tested for emoji/CJK.
- Verified end-to-end against the local llamacpp endpoint (MiniCPM5-2B): ESC
  during bash kills the child, turns the box red with no stale row, shows
  "Operation aborted", restores queued steering messages to the editor,
  clears the spinner, and the session keeps accepting new prompts; read tool
  results and failed edit results render their error exactly once.
- Syntax highlighting restored (was cut in Phase 1: highlight.js's minified
  npm dist cannot compile statically). The engine is a scriptc-runtime port
  of rangi 2.2.0's synchronous regex-rule tokenizer (itself an evolution of
  Speed Highlight, MIT): ~110 lines, leftmost-rule-wins scanning, sub-
  language recursion, and raw-token output. Runtime constraints discovered
  by probe and worked around: g/y-flagged exec is rejected (patterns are
  stripped to non-global clones), RegExp.lastIndex cannot be assigned and
  RegExpExecArray.index has no lowering (match offsets come from
  String.search, match text from exec), `in` is unsupported (registry
  lookups go through Object.keys membership checks), and unknown→record
  casts of RegExp-bearing values are rejected (no cast-based lookups).
  Grammar data for 41 languages (ts/js/jsx/tsx/py/rb/go/rs/c/cpp/cs/java/
  bash/php/sql/yaml/toml/xml/html/css/less/scss/md/lua/pl/docker/make/ps1/
  graphql/ini/http/regex/csv/git/log/todo/uri/asm/dart/kt...) is generated
  from rangi's grammar sources into syntax-highlight-langs.ts; four
  grammars with custom matcher objects (md/dart/kt/js_template_literals)
  are hand-written simplified variants in syntax-highlight-hand.ts.
  Non-ASCII characters in patterns are emitted as \\uXXXX escapes because
  scriptc parses character-class ranges byte-wise. Token types map onto the
  existing syntax* palette. Verified: tokenizer output is byte-identical to
  rangi's on a 14-corpus sample (ts/js/py/go/rs/c/bash/json/sql/yaml/css/
  diff/xml), and the read tool renders python/ts with per-token colors in
  the real binary.
- Post-verification fixes: the first engine draft's match enumeration missed
  rules whose pattern starts mid-line (make's `^.*$` bash-sub rule, kt/dart
  func rules) and reused stale matches after rule dead-marking, leaving
  large spans unstyled in kt/dart/make; the scanner now keeps a per-rule
  match pointer advanced by match start, and the hand-written dart grammar
  gained the missing func/class rules and the `$name`/`${expr}`
  interpolation sub-rule. Token streams now match rangi's on 40/44 sample
  corpora.
- Known simplifications (documented, not bugs): the jsx/tsx tag-interior,
  swift `\(...)` interpolation and md fenced-code sub-language routers are
  dropped (upstream routes them through function sub-languages that cannot
  be expressed as rule records) — their interiors render untyped. Languages
  with sparse grammars (log, csv, plain, git) are sparse in rangi itself.
- Mermaid diagram rendering restored. The renderer is a scriptc-runtime port
  of grok-mermaid 0.2.2 (Apache-2.0, xl0/grok-mermaid) — a zero-dependency,
  terminal-first layout engine that parses flowchart/state/class/ER/sequence
  sources into Unicode box-drawing diagrams with themed spans. Adaptations
  for the scriptc runtime: Intl.Segmenter replaced with the TUI's local
  TextSegmenter, generator functions rewritten as array passes, Map keys
  restricted to numbers (null scope → -1), new Array/fill and compound
  array-element assignments lowered to explicit loops, and switch dispatch
  over unions converted to if-chains. The Markdown transformer intercepts
  ```mermaid fences (skipping assistant-thinking and non-streaming states,
  with a width guard and parse warnings); the settings-manager mermaid mode
  (off/streaming/on) was already in place. Verified: render output (plain
  rows, styled spans, widths, warnings) is byte-identical to upstream
  grok-mermaid 0.2.2 on flowchart/state/class/ER/sequence samples, and a
  real session renders a three-node flowchart with themed borders and
  arrows in the binary. Follow-up crash fix: fenced blocks with indented
  content (the common model style) hit uncatchable array-out-of-bounds
  traps in the layout engine — the transformer now dedents fence content
  by the opening fence's indentation per CommonMark, which is what the
  upstream marked-lexer path provided.
- Version 0.2.2 → 0.2.3.
- Version 0.2.3 → 0.2.4.
- Version 0.2.4 → 0.2.5.

## Phase 15 — models.dev catalog refresh keeps protocol metadata

- The startup background refresh (interactive mode, 3 s after launch, for
  providers with a stored API key) replaced same-id catalog models with the
  models.dev conversion wholesale. `modelsDevToCatalogModels` only emits
  directory fields (name/cost/contextWindow/maxTokens/modalities), so every
  refreshed provider's models lost their catalog `compat` and
  `thinkingLevelMap` — both in the runtime registry and in the
  models-store.json snapshot written after each refresh.
- Consequence observed with deepseek/deepseek-v4-flash (catalog
  `thinkingLevelMap` maps medium to null): with the map gone,
  `getSupportedThinkingLevels` offered all levels, the settings default
  "medium" stopped being clamped, the footer showed a level the model does
  not support, and the inferred compat sent DeepSeek a `reasoning_effort`
  parameter it does not document (the thinking toggle itself still worked:
  V4 Flash thinks by default, verified against the live API).
- `mergeCatalogModels` now merges instead of overwriting: for same-id models
  the directory fields come from the refresh source while `compat` and
  `thinkingLevelMap` stay catalog-authoritative (explicit field construction,
  no spread-after-explicit — scriptc rejects it). New ids from the refresh
  source are appended unchanged.
- Verified in an isolated PI_CODING_AGENT_DIR smoke run: after the refresh
  fires, models-store.json carries the updated costs alongside the intact
  compat/thinkingLevelMap, deepseek-v4-flash clamps a "medium" request to
  high, and new models.dev entries (deepseek-flash) still register.

## Phase 16 — reasoning survives the request-options chain

- The first fix exposed a second, deeper loss: with catalog metadata intact
  the DeepSeek request still carried `thinking:{type:"disabled"}`. JSON
  probes at each hop (JSON.stringify of a null-armed wrapper — cast-view
  reads are shape-instantiated and lie about dynamically-added keys) traced
  `reasoning:"medium"` surviving model-runtime → prepareRequest → the
  provider composer, then vanishing before the openai-completions adapter.
- Root cause: scriptc statically instantiates records across call boundaries
  using the declared fields of the target shape; fields present at runtime
  but missing from the declared parameter type are silently dropped. Three
  shapes did not declare the SimpleStreamOptions extras:
  - provider-composer `streamWith` (typed `StreamOptions`) — the main drop:
    every simple request passes through it;
  - model-runtime `prepareRequest` (typed `ProviderRequestOptions &
    ModelsRequestTransforms`) for parameter and return;
  - openai-completions `streamSimple`, whose `{...base, reasoningEffort}`
    spread-after-explicit literal dropped the explicitly added fields.
- Fixes: `StreamOptionExtras` declared in ai/src/types.ts (toolChoice,
  reasoning, deferred, thinkingBudgets, reasoningEffort) and intersected into
  `SimpleStreamOptions`; `streamWith` and `prepareRequest` parameter/return
  shapes intersect it; both option constructions rewritten as fully explicit
  literals (no spread-after-explicit).
- Verified end-to-end in the compiled binary: deepseek-flash streams
  `thinking:{type:"enabled"}` + `reasoning_effort:"medium"`, the reasoning
  content renders as the italic thinking block in the TUI, and
  `--thinking off` sends `thinking:{type:"disabled"}` which the live API
  confirms turns reasoning off (reasoning_tokens 0).
- Static-runtime field loss diagnosed with file-based probes (stderr is
  swallowed by the running TUI, and cast-view reads lie about dynamically
  added keys — JSON.stringify wrappers and appendFileSync traces are the
  reliable instruments). Model-object fields (thinkingLevelMap and friends)
  do not survive the applyModelsJson/applyExtension rebuild chain, so a
  module-level override registry (setThinkingLevelMapOverride/
  getThinkingLevelMapOverride in ai/src/models.ts, Map<string, string> with
  the map serialized as JSON) now carries thinking-level data to
  getSupportedThinkingLevels, clampThinkingLevel and the openai-completions
  buildParams lookup. Write points: provider-composer modelFromJson (from
  store-derived definitions) and the provider-catalog xiaomi refresh
  post-processing (xiaomiMimoThinkingLevelMap). The official MiMo docs
  (mimo.mi.com) confirm the request body has no reasoning_effort parameter at
  all and thinking is only {type:"enabled"/"disabled"} (default enabled), so
  xiaomi models set compat.supportsReasoningEffort=false at modelFromJson and
  in detectCompat — the deepseek-format branch never sends reasoning_effort
  and thinking:{type} is the only control. Verified effort table:
  low/medium/high/xhigh return 200 (values ignored server-side),
  minimal/max/ultra return 400; live curl probes for xhigh are unreliable
  (passed once, failed in the real pi session), so xhigh is treated as
  unsupported. User-facing levels: off/low/medium/high only. A per-model
  "minimal" entry is mapped to low (the API's lightest effort).
- Tool-box repaint: the differential-rendering cursor drift on
  tool_execution_end (stale pending-colored row above the green box) applies
  to the success transition too once thinking blocks render above the box;
  requestRenderForce(true) is now issued for every tool completion instead of
  errors only. The transient border-line flicker that remains is the forced
  immediate frame itself; residual legacy probes ([tree-dbg], [tl-dbg],
  [IDDBG], [abort-trace], [perf-*], [REQ], [PARSE-FAIL], [probe],
  [shj-engine]) were removed along with the standalone probe files
  (probe48.ts, probe-crash.ts, cat-verify-tmp.ts) and the structuredClone/
  deepFreeze calls in ModelConfig.load whose static lowering dropped
  thinkingLevelMap from synthesized providers.
- Verified: deepseek-flash offers off/low/high/max with per-model max
  persisted, requests carry `thinking:{type:"enabled"}` +
  `reasoning_effort:"max"` per the official mapping, mimo-v2.5-pro clamps a
  global medium to low, and /tree opens without debug leakage.
- Thinking levels for refresh-added models: models.dev carries a
  `reasoning_options` field (toggle + effort values) that the refresh
  conversion ignored, so deepseek-flash had no thinkingLevelMap and offered
  no max level. `modelsDevToCatalogModels` now translates reasoning_options
  into a thinkingLevelMap (effort values map to same-named levels, missing
  levels to null, no toggle entry means off cannot be disabled via
  `off: null`, no effort entry means no map). Cross-checked against
  pi-main's generate-models.ts: the same models.dev field feeds upstream's
  getEffortThinkingLevelMap (for openai-format models), while upstream covers
  deepseek-v4 via hand-verified constants (DEEPSEEK_V4_FLASH_THINKING_LEVEL_MAP)
  matched by `id.includes("deepseek-v4")` — which does not cover the newer
  deepseek-flash either; the generated map for deepseek-flash matches those
  constants and the official DeepSeek effort table (low/high/max,
  reasoning_effort max passes through). detectCompat in pi-main also has no
  xiaomi entry, so the pi-bin detectCompat patch is an additive superset.
- Verified: after the refresh fires, deepseek-flash reports levels
  off/low/high/max, a per-model max setting clamps correctly and the request
  carries `thinking:{type:"enabled"}` + `reasoning_effort:"max"`, matching
  the official DeepSeek thinking-mode docs.
- Xiaomi mimo 400 fix: the live API rejects `reasoning_effort:"minimal"`
  and `"max"` with 400 Invalid request parameters (verified); only low/high
  are accepted. models.dev lists only a toggle for xiaomi models, so neither
  the builtin catalog nor the refresh produced a thinkingLevelMap — and the
  models-store.json synthesis path (synthesizeProvidersFromModelsStore, which
  materializes runtime providers for keyed catalog providers) served
  map-less model instances, letting an unsupportable per-model "minimal"
  level reach the API. A verified XIAOMI_MIMO_THINKING_LEVEL_MAP
  (low/high, others null) is now applied in three places: the builtin catalog
  entries, the models.dev refresh conversion, and the store synthesis path;
  plus refreshCurrentModelMetadata() re-resolves the session model and
  re-clamps the level after a refresh so new metadata applies without a
  restart.
- Verified: mimo-v2.5-pro with a per-model "minimal" setting clamps to low at
  startup (footer • low), the bash-tool request carries
  `thinking:{type:"enabled"}` + `reasoning_effort:"low"` and succeeds.

## Phase 17 — full thinking ladder for models without level data

- Custom/local models (user-defined models.json providers such as a llama.cpp
  router) carry no thinkingLevelMap, and `getSupportedThinkingLevels` hid
  xhigh/max for every map-less model: the selector stopped at high, so levels
  the server actually supports (e.g. Qwen3.8's xhigh) were unreachable. Map-less
  means unknowable: no OpenAI-compatible endpoint declares supported reasoning
  efforts (the lmgo router exposes /v1/models with id/tags/status and a /props
  with build info only; a bare llama-server's /props carries the raw Jinja
  template, which would be brittle per-template source parsing), and models.dev
  covers cloud ids only. Map-less reasoning models now offer the full ladder
  (off/minimal/low/medium/high/xhigh/max) and let unsupported values fail with
  the server's own error message, which typically enumerates the supported set
  (trial-and-error by design). Models with a map — builtin catalog, models.dev
  reasoning_options, user thinkingLevelMap — keep exact filtering.
- Residual registry gaps from Phase 16 closed:
  - refreshCatalogFromModelsDev now registers a setThinkingLevelMapOverride for
    every model whose catalog-authoritative map survived mergeCatalogModels
    (previously only xiaomi was special-cased). Refresh-added models (no store
    entry yet, no startup registration) were map-less for the whole first
    session because the post-refresh re-registration goes through
    toProviderConfigInput, whose projection drops compat/thinkingLevelMap.
  - applyModelsJson tracks the override keys it writes (modelsJsonLevelMapKeys)
    and clears a key when its definition drops thinkingLevelMap, so a
    mid-session models.json edit cannot leave a stale override; entries written
    by other layers (catalog refresh) are never touched. thinkingLevelMapKey is
    exported from ai/src/models.ts for this.
- xiaomi comment unification: the refresh-path comment claimed "reasoning_effort
  low/high only; minimal/max 400" while the Phase 16 live table says
  low/medium/high/xhigh return 200 (values ignored server-side), minimal/max/
  ultra 400, xhigh unstable in real sessions. Comments now match Phase 16; the
  map keeps minimal→low with medium/high selectable since values never reach
  the wire (supportsReasoningEffort false).
- Registry consumers remain: getSupportedThinkingLevels/clampThinkingLevel and
  the openai-completions buildParams lookup. anthropic/openai-responses/google
  map levels through their own mechanisms and do not read thinkingLevelMap —
  a models.json map on such a model silently has no wire effect (known
  boundary, unchanged).
- Verified with a Qwen3.8-27B-GSQ-RCO llama.cpp router (isolated
  PI_CODING_AGENT_DIR, models.json without compat.supportsReasoningEffort):
  the Shift+Tab selector lists all seven levels; xhigh completes a chat turn
  with the reasoning block rendered; /thinking minimal reproduces the server's
  `Unexpected reasoning effort minimal. Supported types are xhigh (default),
  medium, and low` — proving reasoning_effort IS sent for compat-detected
  providers (a provider-level supportsReasoningEffort:false survives the chain;
  the earlier screenshot contradiction came from that flag being added to
  models.json after the error, which also disables all level control); bash
  tool call succeeds at medium. Biome note: repo gate `biome check` currently
  reports 66 pre-existing diagnostics in files untouched by this change
  (biome 2.3.5 in node_modules vs the version the earlier gates ran); the four
  touched files are clean.
- Version 0.2.5 → 0.2.6.

## Phase 18 — over-wide render lines clip instead of aborting the session

- Recurring `Uncaught Error: Rendered line N exceeds terminal width` crashes
  (observed repeatedly at 84 columns with model output containing non-BMP
  characters such as U+1F56D RINGING BELL) traced end to end with a compiled
  binary probe (PI_PROBE_WIDTH measuring the exact crash-log lines):
  - the assertion measurement is terminal-accurate: the static runtime's
    string decode presents a 4-byte UTF-8 character as two surrogate units,
    and the render assertion counts 2 columns for it, matching what foot
    actually renders;
  - the overflow itself comes from the markdown/layout layer mis-reserving
    columns for the same characters (indent + surrogate-split units), letting
    a genuinely over-wide line reach the render loop;
  - visibleWidth itself is consistent (same value at wrap, assertion and
    crash dump; the npm-RGI vs approximation regex divergence is unobservable
    in the compiled binary because U+1F56D is not Extended_Pictographic and
    the binary agrees with node).
- The render loop now writes the diagnostic dump to pi-crash.log and clips the
  offending line with truncateToWidth(line, width) instead of throwing: a
  one-column overflow must not kill the whole session. The dump header changes
  from `Crash at` to `Clipped at`.
- Editor garbling of non-BMP input traced to two per-unit copy sites, both
  proven with a binary probe (units 120,65533,65533,120 after the corrupting
  pass — the astral character became two U+FFFD glyphs):
  - the ANSI strip loops in visibleWidth and stripTerminalSequences copied
    strings per UTF-16 unit (clean[i]); both now detect high/low surrogate
    pairs via charCodeAt and copy them as one slice;
  - the editor's bracketed-paste filter (editor.ts) used split("") — the same
    pair-splitting — before its printable-character filter; it now iterates
    with Array.from (code points). This was the direct cause of the reported
    editor garbling: a pasted U+1F56D reached the buffer as two replacement
    glyphs.
  Verified end-to-end with a bracketed-paste smoke run: the pasted U+1F56D
  renders in the editor, the committed session file contains the clean 4-byte
  sequence (0 FFFD bytes), and the model echoes it back intact.
  The decode-side paths fixed in Phase 14 (StdinBuffer/ProcessTerminal) were
  already code-point safe; this closes the paste/filter/measure side.
- Verified: tsgo/build clean; isolated smoke with the U+1F56D character in a
  submitted message and a forced 84-column history re-render survives (no
  throw path reachable in that run); the pre-existing crash dump format is
  preserved for diagnostics.
- Version 0.2.6 → 0.2.7.

---

## Phase 19 — upstream sync batch A: strict tool sampling, error classification, retry cap

Baseline check: the initial import matches upstream main at `7aab6c26`
(2026-08-26, "serialize thinking signature once"), not the v0.84.3 tag, so the
v0.84.4 fixes merged before that commit are already in.

Ported from upstream (v0.86.0–v0.86.1 plus the #9816 HEAD fix):

- Strict tool sampling, three parts:
  - `detectCompat` no longer defaults `supportsStrictMode` to true for every
    OpenAI-compatible endpoint. The capable set is an explicit allowlist
    (z.ai, DeepSeek, OpenRouter, Ant Ling, Xiaomi, Baseten, Fireworks, Groq,
    Hugging Face, OpenCode, Qwen Token Plan); Cerebras joins the exclusions
    (`af7359b90`), and self-hosted endpoints configured through models.json
    keep the conservative default, so the `strict` field is omitted entirely
    instead of sent as `false` (#9816).
  - Built-in read/bash/edit/read/write and the server harness tools now carry
    `constrainedSampling: { type: "json_schema", strict: "prefer" }`
    unconditionally; the `PI_EXPERIMENTAL` gate (`getExperimentalToolSampling`)
    is gone (`fcff255b0`). `experimental.ts` keeps
    `areExperimentalFeaturesEnabled` for other callers.
- z.ai `Prompt too long` matches the overflow patterns (`0e283203c`).
- Bodyless 400/413 errors are context overflow only for Cerebras
  (`message.provider` check, `661619e87`).
- Cloudflare 520 responses are classified as retryable (`e5d18382a`).
- Agent-level retry backoff is capped: `RetryPolicy.maxAgentDelayMs`,
  `DEFAULT_MAX_AGENT_RETRY_DELAY_MS` (60 s) and `retryDelayMs()` in pi-ai,
  `settings.retry.maxAgentDelayMs` (default 60000) in the settings manager, and
  `agent-session._prepareRetry` now computes its delay through `retryDelayMs`
  (`c37b0e03b`).

Scriptc runtime bugs found while verifying strict end to end (all latent,
because strict sampling was experimental and off by default):

- `makeStrictJsonSchema` mutated records reached through cast views, so the
  strict conversion was silently dropped in the compiled binary: requests went
  out with `strict: true` and the original non-strict schema. Rewritten as a
  pure rebuild over fresh records and arrays (no `structuredClone`, no writes
  through cast views); probe output is now identical to Node for nested
  objects, arrays, unions and optional-null wrapping.
- `partial-json.ts` looked up tail completions in an object literal, so a
  trailing `null` token trapped ("record has no key") the moment a strict
  schema made a model emit `offset: null`. Replaced with an explicit
  if-chain; compiled output is byte-identical to Node across the probe set.
- `Value.Convert` lost every root-level conversion because a
  `Record<string, unknown>` argument passed into its `unknown` parameter is
  copied under scriptc. It now returns the converted value and
  `validateToolArguments` captures it, so `"5"` → `5` coercion works in the
  binary.
- `normalizeOptionalNulls` deleted nulls through a cast view, so optional
  `null`s from strict models failed validation. Rewritten as a pure rebuild.

Verified: wire-level mock tests (strict present with strictified parameters,
absent for unknown endpoints, null optionals stripped, string→number coercion),
real deepseek-flash and xiaomi mimo-v2.5 read and bash tool calls, and an
isolated tmux smoke with the new `retry.maxAgentDelayMs` setting loaded.
tsgo/build clean; version stays 0.2.7 until this round is committed.

---

## Phase 20 — upstream sync batch B: tools, sessions, compaction, skills

Ported from upstream (v0.84.4–v0.86.0):

- Bash signal termination (`a8b3dd199`, `c2d3dc55b`): a process killed by a
  signal no longer counts as a successful command. `signalExitCode()` in
  `agent/harness/utils/signal-exit.ts` maps Linux signal names to 128 + number
  (`os.constants.signals` has no scriptc lowering, SC2020), the CLI wait wrapper
  now reports the termination signal captured from the exit event
  (`child.signalCode` is unsupported) through `waitForProcessResult` /
  `processExitCode`, and the harness env maps its exit result the same way.
  Callers treat a null exit code as a failure. Verified against the compiled
  binary: `sh -c 'kill -9 $$'` reports `Command exited with code 137`.
- The write tool no longer reports a UTF-16 code-unit count as bytes
  (`e583b290a`); the success message is `Successfully wrote to <path>`.
- Skills stay available when bash is the only enabled tool (`1d6dbf9e3`):
  `formatSkillsForPrompt` takes the reading tool and the system prompt picks
  `read` or falls back to `bash`.
- Branch summary output cap raised from 2048 to `min(4096, model.maxTokens)`
  (`e44d75c20`), so a reasoning-heavy summary can no longer consume the whole
  output budget.
- Abort cancels compaction (`bea67d90d`): `AgentSession.abort()` now aborts
  manual compaction and branch summarization and waits for idle; `isIdle`
  includes `isCompacting`; the idle resolver runs from the manual and auto
  compaction finally paths.
- Fork preserves the compaction boundary (`2631b25c3`): labels removed from the
  forked path are remapped, and a compaction entry's `firstKeptEntryId` follows
  its label to the next retained entry. Verified with a compiled probe.
- Session import no longer overwrites an existing file with the same name
  (`1a773c8e7`): colliding destinations get a `-N` suffix. `path.parse` and the
  3-argument `copyFileSync` have no scriptc lowering, so the name/extension
  split and the copy are done manually.
- Session tree navigation is rejected while compaction or another navigation is
  running (`e687434a6`).
- Exact session ID lookup reads only session headers instead of listing and
  parsing transcript bodies (`9b791a4cc`): new `SessionManager.findById`, used
  synchronously by the CLI session resolver.

Already present (verified, no port needed): thinking-block visibility toggling
updates live components without rebuilding the chat, covering history and chat
containers. The upstream `ctx.cwd` tool fix (`62835ea81`) is not applicable:
extensions were removed and the built-in tools are constructed with the
session's cwd.

Still open for the next round: post-tool threshold compaction (`56700d42e`
#6879, `8bdcd4498` #9740). It moves `prepareNextTurn` invocation to the top of
the continuing agent loop and adds `_compactBeforeNextAssistantResponse`; that
touches the loop's abort/steering ordering and needs its own verification.

Verified: tsgo/build clean; deepseek-flash and mimo-v2.5 read/bash round trips;
session create, resume-by-exact-id and fork flows; compiled probes for the fork
boundary. Version stays 0.2.7 until the round is committed.

---

## Phase 21 — upstream sync batch C: DeepSeek catalog, post-tool compaction, session picker, TUI fixes

Ported from upstream (v0.85.0–v0.86.1):

- DeepSeek catalog (`12f59336a`, `bb0f4aa60`): the static catalog and
  `generate-models.ts` now advertise `deepseek-flash` (V4.1 Flash with image
  input and refreshed pricing) plus updated `deepseek-v4-pro` pricing;
  `applyThinkingLevelMetadata` no longer overwrites a models.dev-provided map,
  and opencode-go `deepseek-v4.1-flash` takes its effort map from reasoning
  options. Verified with a compiled catalog probe.
- Post-tool threshold compaction (`56700d42e` #6879, `8bdcd4498` #9740): the
  agent loop stores the completed turn and runs `prepareNextTurn` at the top of
  the continuing iteration, after `shouldStopAfterTurn` and with a steering
  re-poll; `AgentSession._compactBeforeNextAssistantResponse` compacts on the
  threshold before the next provider request; `findCutPoint` falls back to the
  last valid cut point instead of the first message when trailing tool results
  exceed the recent budget. Verified end to end with a mock provider: the
  request order is assistant tool call, summarization, post-compaction request
  that contains both the summary and the kept tool result.
- Progressive session picker (`dfbf793b7`): `SessionManager.list`/`listAll`
  accept an abort signal and publish partial session lists (file names are
  loaded newest first, partial publishes every 10 and 100 loads);
  `SessionSelectorComponent` cancels outstanding loads on select/cancel/exit,
  preserves the selection across progressive updates, and `resolveSessionPath`
  tries the exact-id header lookup before listing. Verified in tmux with
  `--resume`.
- Clipboard (`3349e1db1`, `60e7e76bd`, `6dff740fa`): OSC 52 is emitted only for
  remote sessions or display-less Linux, WSL falls back to the Windows
  clipboard through PowerShell with a temp file, and failures report
  platform-specific guidance instead of a false success. Verified compiled
  against Node for the headless, remote, and fake-display failure paths.
- TUI fixes: the SIGWINCH self-signal is wrapped so restricted seccomp policies
  do not crash startup (`605a1b038`); CJK punctuation separates completions
  while CJK letters stay part of words (`bfa686240`, regexes in `utils.ts`,
  editor trigger patterns and quote decisions); skill slash-command completion
  ranks by bare name (`d7951ec36`); LaTeX gains relational join symbols, dual
  and nested scripts with stacked layout, font-switch commands and centered
  cases rows (`f0592205f`, `fa0e1f48a`). LaTeX and CJK regex output verified
  identical to Node through compiled probes.
- Not ported: WSL image clipboard (image paste was removed from this fork) and
  the native clipboard helper (the static build keeps the exec and OSC 52
  fallbacks).

---

## Phase 22 — upstream sync batch D: vLLM priority, per-model compaction budgets, terminal capabilities, fuzzy search

Ported from upstream (v0.86.0 and earlier post-baseline commits):

- `vllmPriority` (`256f63024` #9004): `OpenAICompletionsCompat.vllmPriority` is
  forwarded as the top-level `priority` request field and accepted by the
  models.json schema. Verified with the mock provider at provider level and
  model level, and absent when unset.
  - Static-runtime finding: the compat record is a union, and typed reads drop
    single-arm fields. `vllmPriority` survived in `ModelConfig` but was gone
    after provider composition and request building. `modelFromJson` and
    `getCompat` now read compat through dyn views, and the value is mirrored in
    a module-level registry in pi-ai `models.ts` keyed `provider:model`, written
    by `applyModelsJson` and cleared when a definition drops the field.
- Per-model compaction budgets (`46bde88a1` #8133):
  `compaction.modelOverrides` keyed by exact `provider/modelId`, resolved per
  field through model override, ordinary setting, then built-in default, with
  validation errors for invalid values. `AgentSession` passes the active model
  to `getCompactionSettings` for manual compaction, threshold checks, overflow
  recovery, and the pre-next-request compaction. Verified with a mock provider
  where the ordinary settings would not trigger compaction but the model
  override does.
- Terminal capability overrides (`e86823096` #8665): `PI_HYPERLINKS`,
  `PI_IMAGE_PROTOCOL`, and `PI_TRUE_COLOR` environment overrides plus
  `terminal.hyperlinks`/`images`/`trueColor` JSON settings applied through
  `setCapabilityOverrides` before the TUI is created. Verified compiled against
  Node, including override precedence.
- Fuzzy search latency (`590144609` #9267): `fuzzyMatch` now finds successive
  query characters with native `indexOf` scans; compiled scores verified
  identical to the previous algorithm across a probe set.
- Not ported in this round: prompt cache warming (`c596d09d9` #9668, a 437-line
  module plus scheduler, settings and UI wiring), click toggling for summaries
  (needs the upstream mouse interaction subsystem, which this fork does not
  have), and llama.cpp `enable_thinking` detection (upstream implements it in
  the removed llama extension; models.json users configure the thinking map
  directly).

---

## Phase 23 — prompt cache warming

Ported from upstream (`c596d09d9` #9668), adapted to this fork (no extension
decision hook, dyn-safe metadata reads):

- `ModelPromptCache` metadata (`short`/`long` lifetimes in seconds) on the model
  plus `models.json` `promptCache` in model definitions and overrides, so any
  provider can opt in by declaring its cache lifetime.
- New `core/cache-warmer.ts`: keeps the prompt cache entry of the last session
  request alive by re-sending it with a one-token output cap before the entry
  expires, with a cost model (cache read vs cache miss vs one output token), a
  0.05 dollar minimum expected saving, streaming and 30-minute idle safety
  windows, and cancellation on mode changes, disposal, or transcript changes.
- Settings: global `cacheWarming` mode (`off`, `streaming`, `idle`) with a new
  Settings selector row and an AgentSession setter.
- Session format: new `usage` entries (`appendUsage`, revive on load) for
  cache-warm refreshes, included in cache-miss stats, cost breakdowns, and the
  footer totals; the TUI renders `Cache warmed: $x` notices behind the existing
  cache-notice toggle; `/session` shows mode, status, refresh cost and cache
  miss penalty.
- SDK wiring starts warming from session requests only (the request's sessionId
  must match), and stops when the transcript no longer extends the request's
  message prefix.

Latent bug found while verifying: `ModelRuntime.prepareRequest` rebuilt the
provider options from a field whitelist that dropped `maxTokens`,
`cacheRetention`, `sessionId`, `temperature`, `samplingParams`, and other stream
options before dispatch. The warm refresh therefore generated a full response
instead of one token, and prompt-cache retention and session-affinity options
never reached the API. `prepareRequest` now passes the full
`SimpleStreamOptions` through with auth headers and env merged in.

Verified with a mock provider that declares `promptCache: { short: 20 }` and a
15-second tool run: the refresh request carries `max_completion_tokens: 1`, a
`usage` entry is persisted, `/session` shows the Cache Warming block, and the
mode is selectable in `/settings`. Session resume with usage entries, a real
DeepSeek tool call, and the post-tool compaction mock all pass. The README
image-resizing removal is unchanged; upstream image input limits
(`f5c946480`) are not ported.

---

## Phase 24 — llama.cpp chat-template thinking detection

Ported from upstream (`1e39862f6`) without the extension system: pi-bin has no
llama.cpp provider, so detection is a `models.json` opt-in that feeds the
existing `qwen-chat-template` wire format.

- New provider flag `detectChatTemplateThinking` in `models.json`. For an
  openai-completions provider that sets it, `core/chat-template-thinking.ts`
  queries `GET /props?model=<id>&autoload=false` for every configured model and
  reports the models whose `chat_template` contains `enable_thinking`. The props
  URL drops a trailing `/v1` from `baseUrl` (the endpoint sits at the server
  root), the provider `apiKey` is sent as a bearer token when it is a literal or
  environment template, probes run concurrently with one 1-second budget per
  provider, and every failure is silent so unloaded router presets, sleeping
  instances and unreachable hosts stay unclassified.
- `ModelRuntime.refresh()` probes opted-in providers and recomposes them when
  metadata arrives, so the interactive startup refresh classifies models before
  the session resolves its model. A per-provider 10-second interval makes the
  second startup composition reuse the first result instead of waiting on the
  timeout twice. `PI_OFFLINE` disables probing.
- Detection rides in `ai/src/models.ts` runtime registries, matching the
  `thinkingLevelMap`/`vllmPriority` precedent: `chatTemplateThinkingModels`
  marks the classified models and the new `thinkingFormat` registry carries the
  wire-visible format. `provider-composer.applyModelsJson` applies it while
  composing the provider: `reasoning` becomes true, a classified model without
  a `thinkingLevelMap` gets upstream's boolean ladder (`off` and `medium`
  selectable), and `getCompat` resolves `thinkingFormat: "qwen-chat-template"`
  from the registry, which makes requests carry
  `chat_template_kwargs: { enable_thinking, preserve_thinking: true }`.
  Explicit settings win: `reasoning: false` opts out, a model `thinkingLevelMap`
  keeps its own ladder, and a `compat.thinkingFormat` on the model or provider
  keeps its own request format.

Latent bug found and fixed for this path: model-level `compat` fields from
`models.json` never reached the request path in the compiled binary. A
definition carrying `supportsDeveloperRole`, `maxTokensField` and
`thinkingFormat` kept only `supportsDeveloperRole` at request time (`thinking`
still went out as `reasoning_effort: medium`), while the Node source sent
`chat_template_kwargs`. The compat record is a union that the static runtime
materializes into a narrower arm, so single-arm fields are dropped. Following
the `vllmPriority` fix, `applyModelsJson` now mirrors the definition's
`compat.thinkingFormat` into a registry and `getCompat` prefers it, which also
makes hand-written `compat.thinkingFormat` work in the binary for the first
time. Other single-arm compat fields (`maxTokensField`, `chatTemplateKwargs`,
`sendSessionAffinityHeaders`, ...) remain affected; only `thinkingFormat` is
mirrored for now.

Design finding: enriching `ModelConfig` definitions by rebuilding provider
records is not viable under scriptc. The rebuilt candidate failed
`validateModelsConfig.Check` with `must be string`/`must be boolean` errors for
every absent optional key (absent-key reads on rebuilt records do not behave
like absent keys on JSON.parse results), so the detection is a runtime overlay
read at composition time instead of a config rewrite.

Verified with a mock llama.cpp server whose `qwen-thinking` template contains
`enable_thinking` and whose `plain` template does not: print mode sends
`enable_thinking: false` for `--thinking off`, `true` for `medium`, and clamps
`high` to `medium`; the plain model sends no thinking field at all; a manual
`thinkingLevelMap` keeps its ladder while detection supplies the wire format; a
model with `reasoning: false` or a manual `compat.thinkingFormat` ignores the
detection; a provider without the flag issues no `/props` requests. In the TUI
the footer shows the classified model with its level, `/thinking` offers
exactly `off` and `medium`, and a bash tool round trip carries
`chat_template_kwargs` with `enable_thinking: true`. With `/props` delayed by
ten seconds, startup costs one second and the second composition skips the
probe; with `PI_OFFLINE=1` no probe is sent at all. `tsgo`, the scriptc build
and `biome` are clean.

Not ported with this feature: upstream's `/llama` command, router model
discovery/load/unload UI, and click-to-toggle summaries (which need the mouse
subsystem). Documentation: `docs/models.md` documents the new provider flag and
the precedence rules, and the README's self-hosted endpoint note mentions it.

### Extension after the first live test (fork-only)

Upstream decides llama.cpp thinking support from the template alone and sends
only `chat_template_kwargs`, which flattens every non-off level into whatever
effort the template defaults to (the Qwen3.8 template defaults to `xhigh`).
llama.cpp's `/props` response also carries `chat_template_caps`, so the probe now
reads `supports_reasoning_effort` next to `chat_template` and records the subset
of classified models whose template accepts `reasoning_effort`. For those models
the `qwen-chat-template` branch sends the mapped `reasoning_effort` in addition
to `chat_template_kwargs`, so `low`/`medium`/`high` keep their depth while `off`
still disables thinking. A template without effort support keeps the upstream
behavior (boolean toggle only), verified with a mock whose caps report
`supports_reasoning_effort: false`.

Two latent problems surfaced while verifying against a real llama.cpp router:

- `getCompat` returned early when a model had no `compat` record of its own
  (`if (!overrides) return detected;`), so detection never applied to models that
  declared no compat fields. Every earlier test config happened to carry a
  provider-level `compat`, which masked it. The early return now honors the
  detection registry too.
- A literal from a string-literal union must not be produced inside a helper: the
  value re-tagged to the union's first arm (`openai`) on the way out, which is
  why an early attempt that wrote the detected format into the `thinkingFormat`
  registry from a constant silently sent `reasoning_effort`. The format stays
  resolved by the `??` chain in `getCompat`, which is the path that works.

Live verification against the user's llama.cpp router (`Qwen3.8-27B-MTP`, loaded
on demand; unloaded models answer `400 model is not loaded` and stay
unclassified): with a captured request log, `--thinking low|medium|high` sends
`chat_template_kwargs: { enable_thinking: true, preserve_thinking: true }` plus
`reasoning_effort: low|medium|xhigh` from the model's `thinkingLevelMap`, and
`--thinking off` sends `enable_thinking: false` with no effort. Response side: a
non-off level produces a thinking block, `off` produces none.

---

## Phase 25 — /llama router model management

Ported the interactive part of upstream's llama.cpp extension (`71026970a` era
UI, `ui.ts`/`index.ts`) without the extension system, the built-in provider, the
alternate-screen panel, and without Hugging Face downloads.

- New `core/llama-router.ts`: a scriptc-safe router client over plain `fetch`
  with dynamic JSON reads. It exposes the model catalog (`GET /models`, status,
  size, quantization, context, vision flag, load/download progress), `POST
  /models/load` with polling until loaded or failed, `POST /models/unload` with
  polling until unloaded, a one-second router-shape probe, and a cancel path
  that unloads an interrupted load and waits for the router to report it. The
  provider `baseUrl` is reduced to the router root by dropping trailing slashes
  and a `/v1` suffix, and a configured `apiKey` is sent as a bearer token. Every
  operation reports failure through a flat result record instead of throwing
  into the UI.
- `/llama` slash command and a `LlamaSelectorComponent` list overlay reusing the
  thinking-selector layout. The command picks candidates from `models.json`
  providers outside the built-in catalog, probes each one, and asks which server
  to manage when several answer; `/llama <url>` manages an unconfigured server.
  The model list sorts resident models first and shows the router's live state;
  selecting an unloaded model loads it behind a cancellable `BorderedLoader`
  with progress messages, selecting a resident model confirms and unloads it,
  and every action re-reads the catalog. Models that other clients load or
  unload show up on the next refresh.
- `BorderedLoader` gained `setMessage` so long operations update the spinner
  text in place.
- Deliberately not ported: Hugging Face search, quantization picking and
  `POST /models` downloads, the SSE progress stream (polling covers it), the
  auto-unload prompt for other loaded models, the `/login llama.cpp` credential
  flow (the router is a `models.json` provider), and mouse interaction.

Verified against the real router at `192.168.100.3:19966` in a tmux session:
the list showed all seven router models with `Qwen3.8-27B-MTP` resident and
`IQ4_XS - 4.25 bpw · 13.3 GiB · 128k ctx` in its row; unloading it through the
confirmation emptied the list entry and re-sorted the list; loading it again
showed the spinner with `Loading Qwen3.8-27B-MTP · loading` and ended with the
model resident and the status line `Loaded Qwen3.8-27B-MTP`; Escape during a
load cancelled it and the reopened list showed the router's post-cancel state
instead of a stale `loading` row. Error paths were exercised with a dead port
and with an empty `providers` block, and `/llama http://192.168.100.3:19966`
worked without any models.json entry. `tsgo` and the scriptc build are clean;
the touched files are clean under `biome` apart from the two pre-existing
findings in `interactive-mode.ts`, while the repo-wide `biome check` still
reports pre-existing diagnostics in files this change does not touch.

---

## Phase 26 — rendering hot paths: regex and per-line cost

First performance round outside the upstream sync; the analysis lives in
`PERF-REPORT.md`, the constraints are no scriptc changes and keeping the inline
main screen.

- The inline lexer no longer tries roughly sixteen anchored regexes at every
  token position. One character scan jumps to the next position that can start a
  construct, only that character's constructs get regex attempts, and plain text
  is copied as one slice instead of slicing the remaining string per token.
  Equivalence was verified against the HEAD lexer by diffing token streams over
  834 documents (synthetic cases plus 778 real session texts) at both the block
  and inline level, zero mismatches.
- The mermaid transformer returns immediately when the text contains no fence
  marker, removing a per-line regex from every render.
- The main screen no longer walks the whole buffer per frame to append resets
  and terminal normalization; that work happens per written line, and the kitty
  image scan now has a fast path when the previous frame had no images and the
  changed range has none. `applyLineResets` stays for full redraws.
- Measured on a 2.5MB session with a 600 chunk, 20ms mock stream: streaming CPU
  went from a pegged core (100% for the whole stream, about 24s CPU for a 2000
  chunk stream) to a steady 3 to 7% (about 0.5s CPU for the 600 chunk stream).
  The background history fill completes in about 14s and costs about 6.5s CPU;
  keystroke echo after the fill is about 14ms per key over a 19,601 line buffer
  (render 6 to 10ms, diff 1 to 2ms, kitty 0ms).
- Render regression: a sample with headings, lists, a table, code fences, LaTeX
  inline and display, a mermaid diagram, CJK and emoji renders identically before
  and after the change apart from cwd and startup context lines.
- Gate state: `tsgo --noEmit` and the scriptc build are clean. `biome` reports no
  new finding in the touched files; the only one there is the pre-existing unused
  `codeSpan` helper in `mermaid.ts`. The repo-wide check still reports
  pre-existing diagnostics (77 errors, 13 warnings) in untouched files, mostly
  the vendored syntax highlighting tables.
- Not done: transcript viewport scoping. Memory is still dominated by the
  per-message rendered line caches (about 95MB for the 2.5MB session), and the
  root render is still O(transcript) per frame; both need the memo and component
  caches limited to the viewport, which is the next round.

---

## Phase 27 — viewport window rendering and a scroll-region history paint

Round C of the rendering work: the transcript is no longer materialized for the
whole session. The analysis stays in `PERF-REPORT.md`.

- The TUI renders a window instead of the whole tree. Containers measure their
  children, skip every child above the window without rendering it, release the
  cached lines of skipped blocks, and return the window together with the count
  of lines above it. Content changes bump a global revision, and a container
  reports the first skipped line whose content changed since it was written;
  the main screen turns that into a full transcript repaint.
- The main screen tracks the window's absolute first line and the buffer total
  and diffs by absolute line index, so lines above the window are never compared
  or rewritten. A forced redraw (tool execution end, suspend resume) rewrites
  only the visible viewport and keeps the scrollback, instead of clearing it.
- Session history is painted into the terminal scrollback through a scroll
  region while the visible tail stays frozen below it. The fill renders one item
  at a time, writes it, releases it, and no longer builds the memo, so the fill
  peak is one item and the editor stays usable while history streams in above
  it. When the tail does not fit on screen the code falls back to a clearing
  repaint, and the excess oldest tail blocks move into history to keep the tail
  on screen.
- The terminal row count now comes from the CSI 18 t window size report and is
  re-read by the resize poll. The static runtime only exposes `stdout.columns`
  and `rows()` returned it, so the layout used the terminal width as its height.
- The footer folds session usage once per entry revision instead of folding
  every entry on every frame (3.5ms per frame over 793 messages).

Measured on the 2.5MB session (19,601 rendered lines, 180x45): keystrokes went
from 12ms to 4ms of CPU each and the frame render from 8 to 11ms to 1.4 to
2.6ms. Resident memory did not move (95MB before and after): the peak is set by
two other terms, a fixed 47MB the provider and model catalog path adds before
any session loads (59.6MB with the llama.cpp configuration against 12.2MB with
a minimal one, both with `--no-session`) and the allocation churn of rendering
the transcript once, which the runtime never returns to the kernel. Both are
next round material, together with the per-frame walk over every history block
that still costs about half of the 4ms keystroke time.

---

## Phase 28 — one line source for every render path

Fixes the self-refreshing screen on `pi -c` with long sessions and the startup
clear-and-replay. Root cause and secondary defects were located with
`PI_DEBUG_REDRAW=1` and `PI_TUI_WRITE_LOG` against the 2.7MB BM session.

- The Phase 27 windowed paths bypassed per-component `render()` post-processing:
  `Container.renderWindow` composed slices from children and `Container.streamLines`
  recursed past the component, so `AssistantMessageComponent` and
  `UserMessageComponent` lost their OSC133 zone markers and
  `ToolExecutionComponent` lost its hide and self-shell handling on those paths.
  The window frame and the stream baseline then disagreed on every message
  boundary line while the line totals matched, so each diff reported a phantom
  change at a fixed transcript line above the viewport and escalated to
  `fullRender(true)`: `\x1b[2J\x1b[H\x1b[3J` plus a full transcript replay in 1MiB
  chunks, visible as the screen flashing through the history to the bottom.
  Idle frames arrive every ~7s from the cache warming `entry_appended` render
  request and every keystroke forces one, which made the session unusable.
- `Container` is now the safe base class: it no longer overrides `renderWindow`
  or `streamLines`, so any component with a custom `render()` produces identical
  strings on all three paths by construction. The windowed and streaming
  composition moved to a new `ConcatContainer` used only where output is the
  pure concatenation of children (the TUI root and the transcript containers).
- `Text` and `Markdown` rendered an empty result as `[""]` on the first call
  while caching `[]`, so `measure`, `render` and later calls disagreed on the
  line count. Both now return and cache the same array.
- `endTranscriptPaint` computed `previousViewportTop` from the scroll region
  instead of the screen height, leaving the top `frozenTailLines.length` rows of
  every screenful outside the viewport bookkeeping and turning changes there
  into full repaints. Its kitty image baseline also covers the kept painted
  lines now, not just the frozen tail.
- The initial fill can no longer fall back to a clearing repaint.
  `fitInitialTailToScreen` excess blocks were never written to the terminal at
  all; they are painted at fill end in transcript order now. The frozen tail is
  sliced at line granularity to the screen capacity and its overflow goes
  through the scroll region above the frozen part, so the quiet fill path
  handles a final message taller than the screen.
- Height changes rewrite only the visible viewport instead of clearing the
  screen and the scrollback. This also removes the startup replay when the CSI
  18 t row report arrives after the first frame.
- CSI 18 t window size reports request a render only when the size changed;
  the resize poll re-queries every 250ms and was scheduling a frame each time.
- Children are no longer mutated through raw array or index assignment:
  `Container.replaceChild` was added and the history mount/detach, the fill
  composition, the extension header swap, the login dialog and the
  settings and thinking submenu filters all go through `clear`, `addChild` or
  `replaceChild`, keeping the structure version and the window bookkeeping
  coherent.
- `ToolExecutionComponent` and `Stack` override `measure` because their custom
  renders change the line count relative to the child sum.

Verified against the 2.7MB BM session (28,589 rendered lines): before, the
debug log recorded `fullRender: firstChanged < viewportTop (28530 < 28544)`
every 7.05s forever and the terminal flashed through the whole transcript each
time; after, the log holds only the first render and one viewport repaint for
the CSI 18 t height report, with zero redraws over 40s idle and while typing,
and the painted history stays intact in the scrollback. The 180x100 run
matches, `--no-session` is unchanged, and the `/thinking` selector filter still
works. Gates: `tsgo --noEmit` and the scriptc build are clean; `biome` reports
no finding in the touched files beyond the pre-existing `useTemplate` in
`interactive-mode.ts`.

---

## Phase 29 — streaming cost: per-frame box storms and per-flush re-parses

Fixes the CPU pegging that grew with use and the 200MB+ resident climb. The
live `pi -c` process measured 98% of one core with 201MB RSS; the perf
callgraph attributed 98% of it to `doRender`.

- `renderWindow` measures every child of the windowed containers on each frame.
  `ToolExecutionComponent.measure` answered with `render().length` (Phase 28),
  so every frame fully re-rendered every tool box in the transcript and the
  same walk then released those boxes, forcing the next frame to rebuild them
  cold. `Box_applyBg` runs two `visibleWidth` passes with grapheme segmentation
  per line and took 81% of the frame. `measure` now mirrors the render branches
  over child measures that honor the render caches and the released heights,
  so a released box answers from its recorded height.
- `AssistantMessageComponent.updateContent` rebuilt every content block on each
  150ms stream flush, re-parsing the full accumulated markdown. Markdown
  sections now split into stable chunks at blank-line boundaries outside fenced
  code, indented code, lists and html blocks, and the components whose chunk
  text is unchanged survive the rebuild, so a flush re-parses only the growing
  tail chunk of at most about 120 lines. Chunked rendering is byte-identical to
  the single-block render over 720 checks (22 synthetic edge cases plus real
  session texts at three widths).
- `message_update` requests a render only when the content refresh ran or the
  tool arguments changed, and `updateArgs` skips the display rebuild for
  unchanged serialized arguments, instead of scheduling a frame per token
  batch.
- Box render caches and released heights key on the box's own content
  generation instead of the global content revision, so an unrelated change
  elsewhere in the tree no longer invalidates every released box above the
  window on every frame.
- scriptc findings: a nested closure that captures a function-typed parameter
  and returns a class instance mis-lowers silently (the assistant transcript
  rendered empty with no trap and no error output), and out of bounds array
  reads trap with a RangeError instead of yielding undefined. The block reuse
  path is closure-free with bounds-guarded lookups and constructor-assigned
  fields.

Measured on the 2.7MB BM session against the streaming mock: a 300 chunk
response over 10s went from 12.7 to 1.6 CPU seconds (one pegged core to about
16%) and from 16 to 43MB of RSS growth per response to 13 to 14MB; a 1200
chunk response went from saturation to 5.6 CPU seconds and from 407MB to
192MB peak RSS. Keystroke frames stay in the 4.5 to 6ms band on the same
session and the resident baseline is about 97MB. Gates: `tsgo --noEmit`, the
scriptc build and `biome` on the touched files are clean.

---

## Phase 30 — the remaining performance list

Clears the open items from Phase 29. Every item was re-measured against the
2.7MB BM session and the streaming mock before and after.

- The keystroke frame cost fell from 6ms to 1.0ms. The dwarf callgraph showed
  66% of the frame inside `FooterComponent.render`, where `getContextUsage`
  walked every message of the branch with a JSON stringify per tool call and
  `getSessionName` rebuilt the flat entry list on every frame. Both now memoize
  on the entry revision, the branch leaf and the model, so a frame reads the
  cached numbers. The skipped block walk that was suspected before the
  measurement turned out to be minor.
- Box background application computed the visible width twice per line, once in
  `applyBg` and once inside `applyBackgroundToLine`. The padding is now applied
  with the width already known. This and the footer fix together took a mock
  stream from 1.6 to 0.9 CPU seconds per response.
- Resident memory stops ratcheting. Two consecutive mock streams grew RSS by
  124KB total against 13 to 14MB per response before. The block reuse
  bookkeeping keeps chunk strings by reference instead of copying every chunk
  text into JSON keys.
- The startup floor dropped from 60.7MB to 17.3MB. The models.dev refresh
  parsed the whole directory, every provider and model, into dynamic records
  for the runtime heap to keep, just to pick one to three providers out of it.
  `extractJsonMember` now scans the top level members and parses only the
  requested provider, and the extracted provider records are identical to the
  full parse output (model counts per provider unchanged). This only shows up
  with credentials for catalog providers, which is why it hid behind the
  minimal configuration.
- `PI_DEBUG_REDRAW` now writes `pi-redraw.log`; it shared `pi-debug.log` with
  the /debug dump and the two overwrote each other. The redraw label also reads
  `redraw:` since it stopped meaning full renders in Phase 28.
- The first frame waits up to 250ms for the CSI 18 t window size report, so
  startup no longer renders at the 24 row fallback and then repaints. The
  redraw log for a launch holds exactly one entry now.
- The retry and error path with an unreachable endpoint went from 15.8 to 1.2
  CPU seconds per prompt, confirming it was the same per frame storm.
- scriptc finding: calling a function typed field as a method is rejected with
  SC1090; the closure has to be read into a local first.

---

## Phase 31 — resume UX: loading placeholder and no new session decor

Two entry polish items on `pi -c` with a long context, reported after the
Phase 29 and 30 speedups made the backfill fast enough to notice them.

- The initial history fill freezes the visible tail and suppresses rendering
  while it streams, so anything typed reached the editor invisibly and only
  appeared when the fill ended. The fill now mounts a `Loading session
  history…` placeholder on the status row before the frozen tail is captured,
  so it stays visible for the whole fill, and input is locked with a null focus
  until the fill completes and hands the editor back. Typed keys during the
  fill are dropped rather than queued unseen.
- Resuming a session with history no longer shows the new session block (logo,
  version, keybinding hints) or the loaded resources listing above the
  backfilled transcript, where they read for a moment as a fresh empty session.
  A fresh or empty session still shows both and an explicit `--verbose` request
  overrides the suppression.
- scriptc finding: reading a discriminator field off a large union array with a
  typed access misreports constructed values while parsed ones behave. The
  session header built by `newSession` leaked through `getEntries`, which made
  every session look like it had history and is why the first cut hid the
  header from new sessions too. The header skip in `getEntries`, `getHeader`
  and `_buildIndex` now goes through `entryTypeOf`, the dyn read helper the
  codebase already keeps for this.

Verified in an isolated terminal: a fresh session shows the header, `--verbose`
shows it, the 2.7MB session shows no header and the loading placeholder with
input locked during the fill and working after it.

---

## Phase 32 — session status spinners in the editor border

Ports the upstream Working spinner rework (upstream `1d9787c11` and
`c1d4c8011`) and puts the initial history fill placeholder there too.

- The editor gains `renderTopBorder` and `renderBottomBorder` hooks and the
  scroll overflow label is centered in the border instead of left aligned.
- The editor top border embeds the active session status at its left edge as
  `── ⠹ Working... ─────`. Narrow widths degrade to the spinner glyph alone and
  the centered scroll label shares the border when both fit.
- All session status spinners embed through the same path now: working,
  compaction, branch summary, retry and the new loading history indicator.
  Editors that do not embed keep the standalone status row.
- The working spinner and label follow the editor border color, so they match
  the thinking level border and the bash mode border automatically.
- The `Loading session history…` placeholder moved from the status row into the
  editor border with the spinner, keeping the whole session UI in one place.
- The frozen tail of the initial history fill repaints in place on render
  requests now, so the spinner animates while the fill streams. Only rows
  below the scroll region are rewritten and the cursor is saved and restored
  around the write, so the fill keeps its own stream position. The height
  guard records the rendered tree height at paint start instead of deriving it
  from the frozen row count, because the line granular tail split moves an
  overflow block that is still part of the tree.
- Status indicators gained `renderInBorder` and `renderSpinnerInBorder`, and the
  loader exposes its rendered indicator for the border path.
- scriptc findings: method calls and field reads through an interface narrowed
  by a type guard are rejected with SC1090 and SC2002, so the embed check uses
  `instanceof CustomEditor` instead of the upstream duck-typed guard.

Verified in an isolated terminal: the fill shows `── ⠙ Loading session history…`
in the border with the spinner advancing and input locked, a mock stream shows
`── ⠧ Working... ────`, a 16 column terminal degrades to `── ⠦ ───`, a scrolled
editor shows the centered `↑ 13 more` label alongside, and the 2.7MB session
still renders all 28595 lines.

---

## Phase 33 — width-change replay downgraded and the frozen tail painted at paint open (2026-09-24)

Two intermittent display corruptions, both traced to the same family: the
screen desyncs from the renderer's baseline and the only repair tool was a full
transcript replay.

- tmux window/session switch glitch, reproduced by inspection: a pane width
  change on switch-back (`window-size latest` re-sizes a hidden window when it
  is displayed again) sends pi through `widthChanged -> fullRender(true)`:
  `\x1b[2J\x1b[H\x1b[3J` clears the screen and the scrollback, then
  `streamLines` rewrites the whole transcript synchronously. On a 5MB session
  that is a multi-second freeze with a visible replay through history and lost
  scrollback. The doubled line spacing seen at the start is every full-width
  line wrapping after the width shrink (every border and box line is exactly
  pane width, so any shrink wraps every line) until the replay rewrites at the
  new width. The `repaintFromLine >= 0` escalation and `forceTranscript` reach
  the same replay. Probe finding: tmux answers neither CSI 18t nor DSR to a
  hidden or detached pane, so the row report dies while the pane is not
  displayed and `rows()` falls back to env `LINES` or 24.
- `widthChanged` now repaints only the visible viewport (`repaintViewport`),
  the same path height changes already took. A resize blip no longer clears
  the scrollback and no longer costs O(transcript). The scrollback above the
  viewport keeps tmux's own reflow of the old lines. A later change landing
  above the viewport can still escalate to the full replay by design.
- `beginTranscriptPaint` now writes the frozen tail into its screen rows at
  open. The paint previously assumed a previous frame had painted the tail at
  exactly those rows, which was a scheduling race: `requestRender` is
  nextTick-throttled, and when the last painted frame predated the tail render
  or `fitInitialTailToScreen`, the fill compared captured lines against the
  tree (identical, so `refreshPaintFrozenTail` wrote nothing) while the screen
  kept the stale frame. That was the blank bottom area and the duplicated or
  missing editor border lines during the fill, gone as soon as the fill ended
  and a forced repaint corrected the rows.
- `refreshPaintFrozenTail` hardening: `paintRenderedTotal` is recorded at paint
  open (it was lazily locked on the first refresh, so a tree mutated between
  capture and first refresh locked the guard onto the wrong height and every
  later comparison mis-windowed the tail), `paintRegionBottom` is fixed at
  open instead of being recomputed from a possibly changed `rows()`, and the
  slice is length guarded. The negative-slice mis-window read `tailLines[i]`
  past the array end, which the scriptc runtime traps on.
- `renderInitialMessages` runs the trust warning and the compaction
  `showStatus` before the tail capture. `showStatus` appends to
  `chatContainer`, which is part of the captured tail, and both used to land
  after the capture when the window size report was already in.
- The window size report wait for the initial fill grew from 400ms to 2s (50
  x 40ms). Hidden panes never answer the query, so the old budget could expire
  while the reply was merely slow and the fill opened with the fallback height.
- `AssistantMessageComponent` setters no-op on an unchanged value. A same-value
  walk rebuilt `contentContainer` (clear and addChild bump the structure
  version), which inflated `contentVersion` of every skipped component above
  the render window and turned the next frame into `content above window
  changed` -> full transcript replay.

Verified: `biome check` and `tsgo --noEmit` clean for the touched files (the
repo-wide pre-existing findings unchanged), scriptc build clean, and in an
isolated tmux session against a copied 4.8MB session the frozen tail shows the
newest message and the editor border immediately at fill start with the
loading placeholder exactly once and the spinner animating, the back-fill
streams above it, the completed frame has exactly the two border lines with
input unlocked, and a live round trip with a bash tool call renders the tool
box and the reply correctly. The CSI 18t/DSR probe was run against tmux 3.7c
in a detached session.

---

## Phase 34 — resize detection at 50ms and paint cancellation on size change (2026-09-24)

What was left of the tmux switch-back glitch after Phase 33: the doubled line
spacing and the brief four-line editor, at idle and while streaming alike.

- Root cause is detection latency. tmux reflows every full-width line the
  moment the pane width changes (every border and box line is exactly pane
  width, so any shrink wraps each line to two rows: the two editor borders
  become four), and pi repaired it only after the 250ms resize poll plus a
  throttled frame. scriptc has no signal handler registration (only the
  spawnSync kill-signal name table survives), so SIGWINCH-driven detection is
  not available and the poll is the only channel.
- Probe findings (PI_DEBUG_RESIZE=1, gated file logger at /tmp/pi-resize.log):
  the poll, the handler, requestRender and the throttle frame were verified
  end to end with timestamps and the whole gap was cadence. Independently
  ruled out by compiled probes: process.nextTick dispatches immediately at
  idle, setInterval ticks through a SIGWINCH self-signal and a direct
  process.stdout.write in the callback, and process.stdout.columns is a live
  ioctl read (scr_process_columns) that tracks resizes from the first tick.
- The stuck-for-23-seconds repro was a resize landing inside the 15s initial
  history fill. While a paint is open every frame goes to
  refreshPaintFrozenTail, whose height guard trips on a width change (the
  rendered line counts move), so nothing repaints until finishInitialFill.
  The probe trace showed one beginTranscriptPaint, painting=true on every
  doRender for 15s, and the repair frame only after endTranscriptPaint.
- The resize poll now runs at 50ms with the CSI 18t size query kept at its
  250ms cadence (every fifth tick), cutting the repair window to roughly one
  poll plus one frame.
- A size change while a paint is open now cancels the paint
  (cancelTranscriptPaint resets the scroll region and drops the baseline) and
  falls through to the normal render path, which repaints the viewport at the
  new size in the same frame. The fill keeps streaming into the unmounted
  history container and the completed fill repaints the full transcript.

Verified in tmux against the 4.8MB session: an idle resize is repaired within
one poll and one frame (the redraw log shows the width-change frame at
~100ms), a resize during the fill shows a clean tail and editor immediately
with the loading placeholder intact, the completed fill renders the whole
transcript with the two border lines and working input, and the scrollback
survives. tmux itself recalculated the test window size twice (180 -> 150 ->
169) during the session; with window-size latest each such flap is its own
reflow, which is why the artifact could appear more than once per switch.

Phase 34 extended: the remaining brief artifact on switch-back had two more
components.

- The Phase 33 width-downgrade exposed an anchor mismatch in
  `repaintViewport`: it wrote the frame bottom-anchored (`CSI height;1H` then
  move up) while the differential renderer's line coordinates are
  top-anchored, so a frame shorter than the terminal was painted as a SECOND
  copy at the bottom rows with the stale first copy left above it, and the
  hardware cursor bookkeeping then drifted into wrong-row writes (fused
  garbage lines with stray box characters). Reproduced with a flap on a short
  session: two identical copies of the whole frame on one screen. The write
  now starts at row 1 like every other path and clears the rows below a short
  frame, so the anchors agree at every content height.
- tmux reflow fuses full-width rows while the pane resizes (a wrapped row
  joins the next row's content: `──┴──┘` style lines), and that transient was
  visible until the repair frame. The resize poll is now 25ms (the CSI 18t
  query stays at 250ms), putting the whole repair window under ~40ms.
- `writeLineBatch` now clips over-wide lines like the other write paths. The
  initial-fill and transcript-replay writes had no clip, so one over-wide
  history line wrapped in the terminal and flagged a row for tmux's later
  reflow to mangle.

Re-verified in tmux: a resize flap on a short session leaves exactly one
frame with no duplicate and no stray box characters in any capture, and the
4.8MB resumed session survives the same flap with zero garbage lines and the
editor borders intact. The remaining flash is tmux's own reflow output before
pi can repaint; under `window-size latest` the switch itself can also resize
the window more than once, and `window-size manual` removes that source
entirely.

---

## Phase 35 — the margin-fill root cause: rows at the last column vs tmux damage redraws (2026-09-25)

The real root of the switch-back artifact (doubled line spacing plus a
four-line editor box), established by capturing the terminal byte stream. The
earlier reflow theories were wrong: copying during the artifact yields clean
text, and reflow would corrupt tmux's grid, which copy reads.

- Evidence chain. A script-wrapped tmux client recording every byte of the
  switch-back redraw showed tmux advances rows two different ways: full
  redraws use CR+LF and absolute positioning (safe), but damage redraws —
  the path a re-shown window takes after the window selector — chain
  `\x1b[<row>;<col>H\x1b[1K` with BARE line feeds to clear rows. In a
  split-window capture those bare LFs number 214 against 3 in a single-pane
  capture. A bare LF only misbehaves at the terminal margin: pi renders every
  row at exactly the pane width (borders, footer padding), so when its pane
  touches the screen's right edge (the right-hand pane of a split) writing the
  last cell leaves the terminal in auto-wrap pending state, and the next bare
  LF advances TWO rows (auto-wrap plus line feed). Every row lands at double
  pitch: doubled spacing everywhere and the two editor borders become four.
  tmux's own grid is unaffected, so copy is clean, and pi's next
  absolute-positioned frame repairs the rows, so it passes in a moment.
  Consistent with everything observed: it needs the right-hand pane geometry,
  it happens with and without the model running, and it is independent of
  session content.
- The fix is to never occupy the last cell. TuiMainScreen renders and writes
  at `contentWidth()`, one column below the terminal width, and the initial
  fill's capture paths use the same width, so a written row can never enter
  auto-wrap pending state and any bare line feed advances exactly one row.
  No write path truncates content any more: the whole layout is one column
  narrower (borders end one cell short of the right edge; footer text is
  intact).
- Re-verified: in a 120-column terminal the client stream carries no content
  at column 120 (bar rows 119 wide), the footer shows its full text, the
  editor keeps exactly two border lines, and the resize flap on short and
  4.8MB sessions stays clean.

Phase 35 extended: a human-verifiable repaint stamp and pane-resume repair.

- `PI_DEBUG_REDRAW=1` now stamps a reverse-video `R<count>:<columns>` mark at
  the top left corner after every pi write (frames, fill batches, frozen-tail
  refreshes). The stamp lives outside the render baseline and stays until the
  next pi write, so a frozen counter means the screen changed without pi. A
  manual test with the stamp settled the attribution: during the artifact the
  counter is frozen and the stamp is wiped (tmux redrew the pane from its own
  grid, which never held the stamp, and the redraw's row advances landed at
  double pitch), and the artifact clears exactly when pi writes again. pi's
  writes are the repair, not the cause; the offending rows can come from any
  full-width row on the client line, including a neighboring pane.
- Window size reports (CSI 18t) now track arrival gaps: a report arriving more
  than 400ms after the previous one means the pane was hidden (tmux answers no
  queries for hidden panes) and just came back, so the TUI forces a viewport
  repaint instead of waiting for a coincidental frame. PI_DEBUG_RESIZE logs
  every report with its gap. Note the detection depends on tmux withholding
  reports from hidden panes, which a headless harness cannot verify.

Phase 35 revised: the margin defense (rendering one column below the terminal
width) is reverted. The repaint stamp and the redraw log attributed the
artifact to tmux resizing pi's pane on hide/show — the pane width flaps 131
<-> 263 on every switch — and the reflow of the previous full-width rows at
that size transition is the whole artifact. The bare line feeds in tmux's
damage redraws all land away from the terminal margin, so the pending-wrap
class the defense targeted does not occur in practice, and the one-column
cost bought nothing. The stamp, the write-time clipping of over-wide lines,
and the pane-resume repair stay.

---

## Phase 36 — built-in llama.cpp provider: login, auto catalog, and synthesized metadata (2026-09-25)

Everything the local-server workflow needed now lives in the TUI: `/login
llama.cpp` records the server URL and key, the model catalog is discovered
from the server, and thinking/context/modalities are synthesized per model.
models.json is no longer required for a llama.cpp server.

- `core/llama-cpp.ts`: the built-in `llama.cpp` provider with the official
  login flow (URL prompt, optional key prompt, catalog validation before the
  credential commits) and a mutable catalog. Discovery reads the router's
  `/models` listing (context from `n_ctx`/`n_ctx_train`, quantization, size,
  vision from `architecture.input_modalities`) and classifies thinking through
  the existing chat-template probes for LOADED models only, so unloaded
  presets and sleeping instances are never woken. Thinking levels pass through
  unmapped: pi's ladder names are exactly llama.cpp's documented effort enum,
  and `off` maps to the disabled toggle.
- `core/model-runtime.ts` composes the provider and runs the discovery on
  every refresh and after login, throttled like the chat-template probes; an
  unreachable server keeps the last known catalog so an offline server machine
  does not empty the model list.
- `/llama` resolves the server URL and key from the credential (previously it
  read only the models.json baseUrl), so the built-in provider is a first-class
  candidate. The loader shows a real progress bar with bytes from the router's
  `progress` record, the load poll tightens to 250ms, and a `/models/sse`
  subscription wakes the poll on status events with polling as the fallback.
- The thinking request now carries the full llama.cpp wire: verified
  `chat_template_kwargs: {enable_thinking: true}` with `reasoning_effort`
  next to it at every ladder level, through a mock router end to end.
- Three static-runtime bugs surfaced while wiring this and are fixed:
  `getProviderEnvValue` read `env[name]` on a typed string record, where a
  missing key traps instead of returning undefined (any provider whose auth
  resolution returns an env record hit this on the first request); model
  records must materialize every optional key and keep `compat` as a dynamic
  record cast from `unknown`, because a record-to-union cast re-tags and a
  literal coerced into an interface copies every typed slot; and the shared
  provider stream helper narrowed `SimpleStreamOptions` to `StreamOptions`,
  whose copy semantics silently dropped `reasoning`, so the thinking toggle
  and effort depth never reached `buildParams` from the unified stream entry.
  The `stream` entry now derives `reasoningEffort` from `reasoning` the same
  way `streamSimple` does.
- The load progress view now draws the upstream layout line for line: accent
  border, bold `Loading model` title, the model id on its own line, a muted
  status line, a 40 cell `█`/`─` bar in accent with the percent, byte counts on
  their own dim line, and `Esc stop` in the footer. It replaced the bordered
  spinner, which squeezed a 10 cell `█`/`░` bar into the message line next to
  the spinner and had no line of its own to hold the byte counts. The view also
  decodes `/models/sse` frames now instead of treating every chunk as a bare
  wake-up, so a load reads `stages`/`current`/`value` for its bar and message
  and a download reads its byte counters, exactly as the upstream extension
  does; a server that reports neither falls back to the catalog `progress`
  record, and the sliding indeterminate bar is gone because upstream draws no
  bar when the server reports no ratio.
- Two more scriptc lowering limits surfaced and are worked around: an
  `AbortController` field on a class has no lowering (the component holds the
  `{ signal, abort }` shape from `createAbortHandle` instead, like every other
  cancellable component), and `TextDecoder.decode` rejects a `{ stream: true }`
  call and an unknown-typed chunk (the SSE reader annotates the chunk as
  `Uint8Array`, carries the incomplete UTF-8 tail into the next chunk through
  `incompleteUtf8TailLength`, and decodes whole buffers).
- Verified against a mock llama.cpp router (catalog, props, load/unload with
  progress, SSE, chat completions) in an isolated tmux session: login flow
  with URL and key prompts, automatic model selection after login, `/model`
  listing with metadata, `/llama` listing with quantization/size/context/vision
  rows, the load progress bar, the full thinking ladder in `/thinking`, and
  round trips at off/low/high/max with the expected wire.
- The reworked progress view was re-captured against a mock router that
  reports stage progress, then against the same mock with stages withheld so
  only the catalog byte counters remain: stage bar with no byte line, byte bar
  with the matching byte line, the unload view, and the return to the model
  list after each flow. Escape cancelled a load mid-flight on every repeat run;
  one earlier attempt let the load finish instead, and it did not reproduce.

Phase 36 verified live against the real server (lmgo-v2 wrapping llama-server):
the catalog is the wrapper's shape — no meta record, the context and launcher
config live in `status.args` and `status.preset` — so the metadata reader now
falls back to parsing `--ctx-size` and the model file's quantization suffix.
The live run confirmed: `/login llama.cpp` with URL and key, the catalog rows
(`Q8_0 · 8k ctx`, `IQ4_XS · 256k ctx`, `IQ3_S - 3.4375 bpw · 11.3 GiB · 256k
ctx` for a loaded model whose meta does appear), contextWindow 8192 and 131072
synthesized per model, the thinking ladder collapsing to `off` for a
non-thinking translation model and expanding to the full ladder for
Qwen3.8-27B-MTP after it was loaded, and a real thinking round trip with the
reasoning block rendered. Loading reports only status text on this server
(the progress bar draws whenever the server publishes a progress record;
lmgo reports progress for downloads, not for loads). The router's LRU
scheduler moved models in and out during the test and the catalog tracked it.

---

## Phase 37 — thinking level detection for llama.cpp models (2026-09-26)

The thinking ladder knew that a llama.cpp model thinks and that its chat
template reads reasoning_effort, but not which effort values the template
accepts. The server cannot say: caps reports a single boolean
(`supports_reasoning_effort` is `effort->stats.used`, common/jinja/caps.cpp) and
the values are decided by the template text, so Qwen3.8-27B-MTP raises
`Unexpected reasoning effort minimal. Supported types are xhigh (default),
medium, and low.` for anything outside low/medium/xhigh while pi offered all
seven levels and a selection failed at render time inside the request.

- `core/chat-template-thinking.ts` probes the levels a template accepts: one
  one-token completion per level carrying pi's own thinking wire
  (`reasoning_effort` next to `chat_template_kwargs.enable_thinking`), where a
  rejecting template fails at render time and names the level it will not take.
  Accepted levels map to themselves, rejected ones to null, levels the probe
  cannot judge are left alone, and the result is cached per server and model so
  discovery costs the six requests once per process instead of on every
  catalog refresh.
- `core/llama-cpp.ts` records the map through the thinkingLevelMap registry for
  every discovered effort model, so the ladder and the request clamp follow the
  template. Verified live against lmgo-v2 wrapping llama-server: the ladder for
  Qwen3.8-27B-MTP shrinks from seven levels to off/low/medium/high/xhigh, which
  is exactly the set its template names.
- `agent-session.ts` self-heals when a rejection does reach a request: the level
  named in `Unexpected reasoning effort ...` is hidden through
  `markThinkingLevelUnsupported` (packages/ai/src/models.ts) and the session
  level re-clamps to the nearest survivor. Verified live on the models.json
  path: a minimal request failed with the template error, the ladder dropped
  minimal, the footer moved to low, and the follow-up round trip succeeded.
- The rejection heuristic stays conservative: a failed probe counts as a
  rejection only when the error names both the effort field and the bad value
  (unexpected, supported types, unsupported, must be), so a transport, schema,
  or capacity error can never hide a level the template accepts.
- The models.json path collapsed every chat-template thinking model to a fixed
  boolean ladder (`CHAT_TEMPLATE_THINKING_LEVEL_MAP`, provider-composer.ts) of
  off and medium even when the template takes reasoning_effort, so an
  effort-capable model there lost every other level to a map that ignored the
  caps verdict. The boolean ladder now applies only to templates that just
  toggle thinking, `refreshChatTemplateThinking` probes the levels of an
  opted-in provider's effort models before the recompose so a models.json
  thinkingLevelMap still overrides the probe, and the probe cache serves both
  paths. Verified live on both: the ladder for Qwen3.8-27B-MTP reads
  off/low/medium/high/xhigh whether the model comes from the built-in provider
  or a models.json provider, and a round trip at high renders its reasoning
  block.
- The ladder hid only what the template refused, so an alias still showed up as
  its own level: Qwen3.8-27B-MTP rewrites `high` to `xhigh` before it validates,
  so `high` rendered, behaved exactly like `xhigh`, and sat next to it in the
  ladder where it read as a separate depth. The probe now asks the server to
  render instead of to generate: `POST /apply-template` answers with the prompt
  the template produced and runs no inference, so two levels whose prompts come
  out byte identical are one behaviour under two names, and the name the prompt
  itself carries ("Reasoning effort is set to xhigh") picks which name survives.
  Qwen3.8-27B-MTP now offers exactly off/low/medium/xhigh on both the built-in
  and the models.json path, and a round trip at xhigh renders its reasoning
  block. A server without the endpoint falls back to the one token completions,
  which settle acceptance but cannot tell aliases apart.
- One adjacent finding stands: the settings `enabledModels` whitelist hides any
  model whose provider/id is not listed, which is how a test provider stayed
  invisible from the catalog until its entry was added.
- The README documents the built-in llama.cpp provider and the measured
  thinking ladder under Differences and Models. Version 0.2.9 → 0.3.0.
