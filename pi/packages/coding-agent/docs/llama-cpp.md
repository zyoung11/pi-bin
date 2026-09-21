# llama.cpp

Pi supports the [llama.cpp](https://github.com/ggml-org/llama.cpp) router server. The router discovers multiple GGUF models and loads or unloads them on demand.

Use a current llama.cpp build with router support. Follow the [build instructions](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md) or install a [prebuilt release](https://github.com/ggml-org/llama.cpp/releases) for your platform.

## Start the router

Start `llama-server` without `--model` or `-m`. Passing a model starts single-model mode instead of router mode.

```bash
llama-server \
  --models-dir ~/models \
  --no-models-autoload \
  --jinja \
  --host 127.0.0.1 \
  --port 8080 \
  -ngl 999 \
  -c 32768
```

Important options:

- `--models-dir ~/models` discovers local GGUF files.
- `--no-models-autoload` keeps loading explicit through `/llama`.
- `--jinja` enables compatible chat templates and tool calling.
- `-ngl 999` offloads as many layers as possible to the GPU.
- `-c 32768` sets the context window for each loaded model. Omit it to use the model's native context, which may require substantially more memory.

A single-file model can sit directly in the model directory. Put multimodal and multi-shard models in separate subdirectories:

```text
~/models/
├── llama-3.2-1b-Q4_K_M.gguf
├── gemma-3-4b-it-Q4_K_M/
│   ├── gemma-3-4b-it-Q4_K_M.gguf
│   └── mmproj-F16.gguf
└── large-model-Q4_K_M/
    ├── large-model-Q4_K_M-00001-of-00003.gguf
    ├── large-model-Q4_K_M-00002-of-00003.gguf
    └── large-model-Q4_K_M-00003-of-00003.gguf
```

Restart the router after manually adding files. For per-model context sizes and other options, use [llama.cpp model presets](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md#model-presets).

## Configure Pi

This build has no built-in llama.cpp provider. Declare the router in `models.json` in the agent config directory, pointing `baseUrl` at its OpenAI-compatible endpoint:

```json
{
  "providers": {
    "llamacpp": {
      "baseUrl": "http://127.0.0.1:8080/v1",
      "api": "openai-completions",
      "apiKey": "optional-secret",
      "detectChatTemplateThinking": true,
      "models": [
        { "id": "Qwen3.8-27B", "input": ["text"], "contextWindow": 131072, "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 } }
      ]
    }
  }
}
```

`apiKey` is sent as a bearer token to the router when set. `detectChatTemplateThinking` is optional and classifies thinking support through `/props`; see [models.md](models.md#llamacpp-chat-template-thinking).

If the server uses an API key, start `llama-server` with the matching `--api-key` value. Keep `--host 127.0.0.1` for local-only access.

## Manage models

Run:

```text
/llama
```

The command finds routers among the non-catalog providers in `models.json` and asks which one to manage when several answer. `/llama http://host:port` manages a server that is not configured in `models.json`.

- Select an unloaded model to load it. The router loads what its model directory already holds; this build has no model download flow.
- Select a loaded or sleeping model to confirm and unload it. Pi never deletes model files.
- Press Escape during a load to cancel it; the router drops the interrupted load.

The list shows the router's live state, including models only the router knows about, and always re-reads it after every action. Models that other clients load or unload appear on the next refresh.

Only loaded models appear in `/model`. After loading a model, run `/model` to select it for the current Pi session.

## Troubleshooting

Check that the router is reachable:

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/models
```

- **No models in `/llama`:** Check `--models-dir`, the directory layout, and restart the router.
- **`/llama` says no router answered:** The provider `baseUrl` in `models.json` must point at a llama.cpp server in router mode, and the command reaches `<root>/models`; `https://example.com/v1` becomes `https://example.com/models`.
- **Model missing from `/model`:** Load it with `/llama` first.
- **Load fails or uses too much memory:** Lower `-c` or unload another model.
- **Server is not in router mode:** Start it without `--model`, `-m`, or `-hf`.
