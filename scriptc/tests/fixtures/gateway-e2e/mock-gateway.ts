/* The local mock AI Gateway the gateway e2e suite drives both lanes
 * against: the /v1/models catalog + per-model endpoints (lib/models.ts's
 * fetches) and the /v4/ai model routes the @ai-sdk/gateway provider posts
 * to, speaking the provider's actual wire shapes (JSON doGenerate result
 * for language models, base64-string arrays for images, a base64 string
 * for speech, an SSE result event for video — the schemas in
 * @ai-sdk/gateway 4.x). Everything is DETERMINISTIC: fixed catalog, fixed
 * bytes, fixed x-request-id headers (the CLI under test derives artifact filenames
 * from them), and the language route echoes the prompt back so prompt
 * assembly (stdin piping, --system, image parts) is verified end-to-end.
 *
 * Special model ids drive the error paths:
 *   zdummy/no-owner      → 500 with a JSON error body
 *   zdummy/unauthorized  → 401 (GatewayAuthenticationError's contextual text)
 *   zdummy/hang          → never answers (the SIGINT test interrupts here)
 */
import { createServer, type Server } from "node:http";

export const MOCK_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
export const MOCK_MP3 = Buffer.from("ID3fake-mp3-bytes-for-the-e2e-suite");
export const MOCK_MP4 = Buffer.from("not-an-mp4-but-deterministic-bytes-for-e2e");
export const MOCK_TRANSCRIPT = "hello from the mock transcriber";

const MODELS = [
  { id: "openai/gpt-5.5", name: "GPT-5.5", description: "OpenAI flagship.", owned_by: "openai", type: "language", context_window: 400000, max_tokens: 128000, released: 1750000000, tags: ["tools"], pricing: { input: "0.00000125", output: "0.00001", input_cache_read: "0.000000125", web_search: "0.01" } },
  { id: "openai/gpt-image-2", name: "GPT Image 2", owned_by: "openai", type: "image", released: 1740000000, pricing: { image: "0.04" } },
  { id: "openai/tts-1", name: "TTS-1", owned_by: "openai", type: "speech", pricing: { input: "0.000015" } },
  { id: "openai/whisper-1", name: "Whisper", owned_by: "openai", type: "transcription", pricing: { input: "0.000006" } },
  { id: "anthropic/claude-opus-4.6", name: "Claude Opus 4.6", description: "Frontier reasoning.", owned_by: "anthropic", type: "language", context_window: 200000, max_tokens: 64000, released: 1764547200, tags: ["reasoning", "tools"], pricing: { input: "0.000005", output: "0.000025", input_cache_read: "0.0000005", input_cache_write: "0.00000625" } },
  { id: "google/gemini-3-flash-image", name: "Gemini 3 Flash Image", owned_by: "google", type: "language", tags: ["image-generation"], pricing: { input: "0.0000003", output: "0.0000025" } },
  { id: "bytedance/seedance-2.0", name: "Seedance 2.0", owned_by: "bytedance", type: "video", pricing: {} },
  { id: "voyage/voyage-4", name: "Voyage 4", owned_by: "voyage", type: "embedding", pricing: { input: "0.00000012" } },
  { id: "zdummy/no-owner", type: "language" },
  { id: "zdummy/unauthorized", type: "language" },
  { id: "zdummy/hang", type: "language" },
];

const ENDPOINTS: Record<string, unknown> = {
  "anthropic/claude-opus-4.6": {
    id: "anthropic/claude-opus-4.6",
    name: "Claude Opus 4.6",
    description: "Frontier reasoning.",
    released: 1764547200,
    endpoints: [
      { provider_name: "anthropic", context_length: 200000, pricing: { prompt: "0.000005", completion: "0.000025" }, uptime_last_1d: 99.98, latency_last_1h: { p50: 1.42 }, throughput_last_1h: { p50: 61.5 } },
      { provider_name: "vertex", context_length: 200000, uptime_last_1d: 99.5, latency_last_1h: {}, throughput_last_1h: { p50: 48.25 } },
    ],
  },
};

interface PromptPart {
  type: string;
  text?: string;
  mediaType?: string;
  data?: unknown;
}
interface PromptMessage {
  role: string;
  content: PromptPart[] | string;
}

/** The language route's echo: role-tagged text parts verbatim, non-text
 * parts as `<type mediaType Nbytes>` (base64 length — enough to pin the
 * bytes crossed without dumping them). */
function echoPrompt(prompt: PromptMessage[]): string {
  return prompt
    .map(
      (m) =>
        `${m.role}:` +
        (Array.isArray(m.content)
          ? m.content
              .map((p) =>
                p.type === "text"
                  ? p.text
                  : `<${p.type} ${p.mediaType ?? ""} ${typeof p.data === "string" ? p.data.length : "?"}b>`,
              )
              .join("|")
          : String(m.content)),
    )
    .join("\n");
}

export async function startMockGateway(): Promise<{ server: Server; baseUrl: string; hangArrivals: (token: string) => number }> {
  const hangArrivalsByToken = new Map<string, number>();
  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const url = req.url ?? "/";
      const body: unknown = chunks.length > 0 ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : null;
      const json = (status: number, payload: unknown, headers: Record<string, string> = {}): void => {
        res.writeHead(status, { "content-type": "application/json", ...headers });
        res.end(JSON.stringify(payload));
      };

      if (url === "/v1/models") return json(200, { data: MODELS });
      const em = /^\/v1\/models\/(.+)\/endpoints$/.exec(url);
      if (em) {
        const info = ENDPOINTS[decodeURIComponent(em[1]!)];
        return info !== undefined
          ? json(200, { data: info })
          : json(404, { error: { message: "model not found" } });
      }

      if (url === "/v4/ai/language-model") {
        const modelId = String(req.headers["ai-language-model-id"] ?? "?");
        if (modelId === "zdummy/no-owner") {
          return json(500, { error: { message: "upstream exploded", type: "internal_server_error" } });
        }
        if (modelId === "zdummy/unauthorized") {
          return json(401, { error: { message: "who are you", type: "authentication_error" } });
        }
        if (modelId === "zdummy/hang") {
          // Arrival is attributed to the caller's bearer token: the two
          // differential lanes run concurrently against one gateway, and
          // the SIGINT test must observe ITS child's request, not the
          // sibling lane's.
          const token = String(req.headers["authorization"] ?? "");
          hangArrivalsByToken.set(token, (hangArrivalsByToken.get(token) ?? 0) + 1);
          return; // never answers
        }
        const prompt = (body as { prompt?: PromptMessage[] } | null)?.prompt ?? [];
        const content: unknown[] = [{ type: "text", text: `[${modelId}] ${echoPrompt(prompt)}` }];
        if (modelId === "google/gemini-3-flash-image") {
          // The language-image path: the CLI under test picks the first image/* FILE
          // part out of generateText's result.files (v4 file parts carry a
          // discriminated data object).
          content.push({
            type: "file",
            mediaType: "image/png",
            data: { type: "data", data: MOCK_PNG.toString("base64") },
          });
        }
        // Multi-model jobs print in COMPLETION order, and two mock
        // responses answering in the same tick complete in scheduler order
        // — nondeterministic on BOTH lanes under load. A fixed per-model
        // stagger (list-position spacing, MODELS order) pins completion
        // order to list order without changing any byte of output.
        const stagger = MODELS.findIndex((m) => m.id === modelId);
        setTimeout(() => {
          json(
            200,
            {
              content,
              finishReason: "stop",
              usage: { inputTokens: 7, outputTokens: 11, totalTokens: 18 },
            },
            { "x-request-id": "e2e-text-1" },
          );
        }, Math.max(0, stagger) * 60);
        return;
      }

      if (url === "/v4/ai/image-model") {
        return json(200, { images: [MOCK_PNG.toString("base64")], warnings: [] }, { "x-request-id": "e2e-img-1" });
      }
      if (url === "/v4/ai/speech-model") {
        return json(200, { audio: MOCK_MP3.toString("base64"), warnings: [] }, { "x-request-id": "e2e-speech-1" });
      }
      if (url === "/v4/ai/transcription-model") {
        return json(
          200,
          { text: MOCK_TRANSCRIPT, segments: [], language: "en", durationInSeconds: 1.5, warnings: [] },
          { "x-request-id": "e2e-tr-1" },
        );
      }
      if (url === "/v4/ai/video-model") {
        // The video route answers an SSE stream carrying ONE result event.
        res.writeHead(200, { "content-type": "text/event-stream", "x-request-id": "e2e-vid-1" });
        res.end(
          `data: ${JSON.stringify({
            type: "result",
            videos: [{ type: "base64", data: MOCK_MP4.toString("base64"), mediaType: "video/mp4" }],
            warnings: [],
          })}\n\n`,
        );
        return;
      }

      return json(404, { error: { message: `no route ${url}` } });
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  if (addr === null || typeof addr !== "object") throw new Error("no mock gateway address");
  return { server, baseUrl: `http://127.0.0.1:${addr.port}`, hangArrivals: (token: string) => hangArrivalsByToken.get(`Bearer ${token}`) ?? 0 };
}
