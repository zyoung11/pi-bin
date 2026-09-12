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
- Version 0.2.2 → 0.2.3.
