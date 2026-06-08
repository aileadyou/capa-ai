export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function hasOpenRouter(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== "replace-with-openrouter-api-key");
}

export function activeModel(): string {
  return process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
}

interface CallOptions {
  temperature?: number;
  maxTokens?: number;
  /** Ask OpenRouter for a strict JSON object response. */
  json?: boolean;
}

interface OpenRouterChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

/**
 * Single entry point to OpenRouter. Throws when the key is missing or the
 * request fails so callers can fall back to premade content gracefully.
 */
export async function callOpenRouter(messages: ChatMessage[], opts: CallOptions = {}): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!hasOpenRouter() || !apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const referer = process.env.OPENROUTER_REFERER ?? "http://localhost:8080";
  const title = process.env.OPENROUTER_APP_TITLE ?? "Nova CAPA Prototype";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": referer,
      "X-Title": title,
    },
    body: JSON.stringify({
      model: activeModel(),
      messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 1200,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  const payload = (await response.json().catch(() => undefined)) as OpenRouterChatResponse | undefined;

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `OpenRouter request failed (${response.status}).`);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenRouter returned an empty response.");
  }
  return content;
}

/** Best-effort JSON extraction from a model response (handles ```json fences). */
export function parseJsonLoose<T = unknown>(raw: string): T {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf("{");
  const startArr = candidate.indexOf("[");
  const from = startArr !== -1 && (startArr < start || start === -1) ? startArr : start;
  const slice = from > 0 ? candidate.slice(from) : candidate;
  return JSON.parse(slice) as T;
}
