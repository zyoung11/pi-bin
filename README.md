<div align="center">
<pre style="font-family:'Courier New',Courier,monospace;font-size:12px;line-height:1.17;white-space:pre;margin:0;color:inherit;">
<span>╔══╗                  ╦        </span>
<span>║  ║ o                ║   o    </span>
<span>╠══╝ ╦      ════      ╠═╗ ╦ ╔╗╔</span>
<span>║    ║                ║ ║ ║ ║║║</span>
<span>╩    ╩                ╚═╝ ╩ ╝╚╝</span></pre>
</div>

A truly minimal pi-coding-agent compiled to an ~8 MB zero-dependency native
executable.

Forked from [pi-mono](https://github.com/badlogic/pi-mono) (v0.84.3) and compiled with [scriptc](https://scriptc.dev) (v0.0.35) into a single static Linux binary. No JS engine, no `node_modules` at runtime.

| | pi-bin | pi (Node.js) |
|---|---|---|
| Binary | 7.9 MB single ELF | 289 MB `node_modules` + Node.js ≥ 24 |
| Startup to `--version` | ~2 ms | ~380 ms |
| Startup to `--list-models` | ~20 ms | ~420 ms |
| TUI ready (no session) | ~60 ms | ~490 ms |
| TUI ready (5 MB session) | ~170 ms | ~540 ms |
| Idle memory (TUI running) | ~10 MB | ~145 MB |
| Memory (chat round-trip) | ~9 MB | ~152 MB |
| Memory (5 MB session loaded) | ~104 MB | ~259 MB |
| Operating System Support | Linux (currently) | Linux, Windows, MacOS |
| Runtime dependencies | libc, libm, libz | Node.js ≥ 24 + npm packages |

Each number is the median of repeated runs on Linux x86-64 (same config, same
terminal size, same local model endpoint).

## Differences

Removed:

- Extension system (TypeScript extensions, extension marketplace)
- grep / find / ls
- Fullscreen TUI mode (regular mode only)
- Mermaid diagram rendering, syntax highlighting (code renders as plain
  theme-colored text)
- Telemetry, update checks, first-run wizard
- OAuth authentication (providers that require it, e.g. Anthropic Claude
  subscription auth, are no longer usable. API-key providers work fine)
- Automatic light/dark theme switching (dark + custom themes only)
- Image resizing (images pass through as-is. Over 4 MB is rejected)
- `/changelog`, `/login` and the extension slash commands are gone

Everything else (the agent loop, tools, TUI, sessions, compaction, skills,
prompt templates, and the bash/edit/read/write workflow) behaves the same.

The scriptc compiler (v0.0.35) is bundled in the repo at `scriptc/`, so no
separate install is needed. It is included unmodified and pinned for reproducible builds and debugging. No compiler changes were made, and all fixes live in this repo's TypeScript source. 

## Install

Grab the latest binary from [Releases](https://github.com/zyoung11/pi-bin/releases), then:

```bash
mv pi ~/.local/bin/
```


## Building from source

Prerequisites:

- Node.js ≥ 24 (scriptc requires it. Make sure `node --version` reports ≥ 24)
- Linux x86-64

```bash
git clone https://github.com/zyoung11/pi-bin.git
cd pi-bin

npm install --ignore-scripts   # install npm dependencies
npm run build:native           # compile → ./pi (8 MB ELF)
npm run check                  # optional: biome + tsgo --noEmit
```

The build reads `packages/coding-agent/src/cli.ts` and emits the static binary to `./pi`. 

## Models

Providers are assembled at startup from two files in `~/.pi/agent/`:

- `models.json`: providers you write by hand (baseUrl + api + models)
- `models-store.json`: the catalog cache from the original pi. Its providers
  (deepseek, zai, xiaomi, ...) are synthesized in memory and merged in, so
  models configured through the original pi work without any extra setup

API keys resolve from `auth.json` by provider id, the same keys the original
pi stored.

To add your own provider, append a block to `models.json`:

```json
{
  "providers": {
    "my-provider": {
      "baseUrl": "https://api.example.com/v1",
      "api": "openai-completions",
      "apiKey": "sk-...",
      "models": [
        {
          "id": "my-model",
          "name": "My Model",
          "reasoning": true,
          "input": ["text"],
          "contextWindow": 128000
        }
      ]
    }
  }
}
```

`api` must be `openai-completions` (any OpenAI-compatible endpoint works,
including llama.cpp servers). Select models with `--model`, the `/model`
command, or `Ctrl+P`.
