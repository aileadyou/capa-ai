import express from "express";

const app = express();

app.use(express.json({ limit: "1mb" }));

function isNovaRequest(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.task === "string" &&
    Array.isArray(value.messages) &&
    value.messages.every(
      (message) =>
        message &&
        typeof message === "object" &&
        ["system", "user", "assistant"].includes(message.role) &&
        typeof message.content === "string",
    )
  );
}

app.get(["/", "/api/nova"], (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "nova-openrouter-proxy",
    status: process.env.OPENROUTER_API_KEY ? "configured" : "missing_openrouter_api_key",
  });
});

app.post(["/", "/api/nova"], async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-5-mini";
  const referer = process.env.OPENROUTER_REFERER ?? "https://capa-ai.vercel.app";
  const title = process.env.OPENROUTER_APP_TITLE ?? "CAPA AI";

  if (!apiKey) {
    res.status(503).json({ ok: false, error: "OPENROUTER_API_KEY is not configured." });
    return;
  }

  if (!isNovaRequest(req.body)) {
    res.status(400).json({ ok: false, error: "Invalid Nova task request." });
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
        messages: req.body.messages,
        temperature: req.body.temperature ?? 0.2,
        max_tokens: req.body.maxTokens ?? 1200,
      }),
    });

    const payload = await openRouterResponse.json().catch(() => undefined);

    if (!openRouterResponse.ok) {
      res.status(openRouterResponse.status).json({
        ok: false,
        error: "OpenRouter request failed.",
        detail: payload,
      });
      return;
    }

    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      res.status(502).json({ ok: false, error: "OpenRouter returned an empty Nova response." });
      return;
    }

    res.status(200).json({
      ok: true,
      task: req.body.task,
      model,
      content,
      usage: payload?.usage,
    });
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error instanceof Error ? error.message : "Nova proxy failed.",
    });
  }
});

export default app;
