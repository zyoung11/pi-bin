<div align="center">
<pre style="font-family:'Courier New',Courier,monospace;font-size:12px;line-height:1.17;white-space:pre;margin:0;color:inherit;">
<span>╔══╗                  ╦        </span>
<span>║  ║ o                ║   o    </span>
<span>╠══╝ ╦      ════      ╠═╗ ╦ ╔╗╔</span>
<span>║    ║                ║ ║ ║ ║║║</span>
<span>╩    ╩                ╚═╝ ╩ ╝╚╝</span></pre>
</div>

A truly minimal pi-coding-agent compiled to an ~8.6 MB zero-dependency native
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
- OAuth/subscription authentication (Claude Pro/Max, ChatGPT/Codex, GitHub
  Copilot logins are not available; API-key providers work fine via `/login`)
- Automatic light/dark theme switching (dark + custom themes only)
- Image resizing (images pass through as-is. Over 4 MB is rejected)
- `/changelog` and the extension slash commands are gone

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
npm run build:native           # compile → ./pi (8.6 MB ELF)
npm run check                  # optional: biome + tsgo --noEmit
```

The build reads `packages/coding-agent/src/cli.ts` and emits the static binary to `./pi`. 

## Models

Provider coverage (✓ works with `/login`, ✗ not supported yet):

| Provider | pi-bin |
|---|---|
| Ant Ling | ✓ |
| Amazon Bedrock | ✗ |
| Anthropic | ✗ |
| Azure OpenAI | ✗ |
| Baseten | ✓ |
| Cerebras | ✓ |
| Cloudflare AI Gateway | ✗ |
| Cloudflare Workers AI | ✗ |
| DeepSeek | ✓ |
| Fireworks | ✓ |
| GitHub Copilot | ✗ |
| Google Gemini | ✗ |
| Google Vertex | ✗ |
| Groq | ✓ |
| Hugging Face | ✓ |
| Kimi For Coding | ✗ |
| MiniMax (and CN) | ✗ |
| Mistral | ✗ |
| Moonshot AI (and CN) | ✓ |
| NVIDIA | ✓ |
| OpenAI | ✗ |
| OpenCode (and Go) | ✓ |
| OpenRouter | ✓ |
| Qwen Token Plan (and CN / Individual) | ✓ |
| Together | ✓ |
| Vercel AI Gateway | ✗ |
| xAI | ✗ |
| Xiaomi (and Token Plan AMS / CN / SGP) | ✓ |
| Z.AI (and Coding CN) | ✓ |

- ✗ providers need API adapters the static build does not implement:
  Anthropic-wire protocol (Anthropic, Kimi For Coding, MiniMax, Vercel AI
  Gateway), OpenAI Responses protocol (OpenAI, xAI, Azure OpenAI),
  Google/Bedrock/Mistral proprietary protocols, OAuth/subscription logins
  (GitHub Copilot, OpenAI Codex), or special credential chains (Amazon
  Bedrock, Cloudflare, RADIUS).
- Self-hosted OpenAI-compatible endpoints (llama.cpp, vLLM, ...) work through
  a `models.json` file in the agent config directory instead.
- Select models with `--model`, the `/model` command, or `Ctrl+P`.
