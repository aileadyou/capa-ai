import type { IncomingMessage, ServerResponse } from "node:http";
import type { ViteDevServer } from "vite";

interface NovaProxyRequest {
  task: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  maxTokens?: number;
}

interface OpenRouterChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: unknown;
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Nova request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Nova request body must be valid JSON."));
      }
    });
    req.on("error", reject);
  });
}

function writeJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function isNovaProxyRequest(value: unknown): value is NovaProxyRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as NovaProxyRequest;
  return (
    typeof request.task === "string" &&
    Array.isArray(request.messages) &&
    request.messages.every(
      (message) =>
        message &&
        typeof message === "object" &&
        ["system", "user", "assistant"].includes(message.role) &&
        typeof message.content === "string",
    )
  );
}

export function configureNovaProxy(server: ViteDevServer) {
  server.middlewares.use("/api/nova", async (req, res) => {
    if (req.method !== "POST") {
      writeJson(res, 405, { ok: false, error: "Method not allowed." });
      return;
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
    const referer = process.env.OPENROUTER_REFERER ?? "http://localhost:8080";
    const title = process.env.OPENROUTER_APP_TITLE ?? "Nova CAPA Prototype";

    if (!apiKey) {
      writeJson(res, 503, { ok: false, error: "OPENROUTER_API_KEY is not configured." });
      return;
    }

    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      writeJson(res, 400, { ok: false, error: error instanceof Error ? error.message : "Invalid request." });
      return;
    }

    if (!isNovaProxyRequest(body)) {
      writeJson(res, 400, { ok: false, error: "Invalid Nova task request." });
      return;
    }

    try {
      const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": referer,
          "X-OpenRouter-Title": title,
        },
        body: JSON.stringify({
          model,
          messages: body.messages,
          temperature: body.temperature ?? 0.2,
          max_tokens: body.maxTokens ?? 1200,
        }),
      });

      const payload = (await openRouterResponse.json().catch(() => undefined)) as
        | OpenRouterChatResponse
        | undefined;

      if (!openRouterResponse.ok) {
        writeJson(res, openRouterResponse.status, {
          ok: false,
          error: "OpenRouter request failed.",
          detail: payload,
        });
        return;
      }

      const content = payload?.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) {
        writeJson(res, 502, { ok: false, error: "OpenRouter returned an empty Nova response." });
        return;
      }

      writeJson(res, 200, {
        ok: true,
        task: body.task,
        model,
        content,
        usage: payload?.usage,
      });
    } catch (error) {
      writeJson(res, 502, {
        ok: false,
        error: error instanceof Error ? error.message : "Nova proxy failed.",
      });
    }
  });
}
