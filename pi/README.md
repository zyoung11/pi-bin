# pi (static fork)

Upstream [pi](https://github.com/badlogic/pi-mono) coding agent rebuilt as a
fully static native binary via [scriptc](https://scriptc.dev) — no JS engine,
no runtime asset reads. Linux x86-64.

## Running

```bash
./pi                       # interactive TUI (default theme: dark)
./pi --no-session          # ephemeral session
./pi --print "..."         # non-interactive
./pi --list-models         # list configured models
```

Models come from `~/.pi/agent/models.json` plus providers synthesized in memory
from `~/.pi/agent/models-store.json`; API keys from `~/.pi/agent/auth.json`.

## Custom themes

Drop a theme JSON into `~/.pi/agent/themes/*.json` and pick it under
`/settings → Theme` (the built-in theme is `dark`).

## Images

Paste an image with Ctrl+V or reference an absolute image path in your
message; it is inlined for vision models. Images over 4 MB are rejected —
scale them down first.

## Rebuild

```bash
npm run build:native       # requires Node 24+ (scriptc)
```

Development notes live in `../docs/`.
