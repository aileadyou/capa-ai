import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

import { seedAll } from "./seed.js";
import * as repo from "./repo.js";
import * as logic from "./logic.js";
import * as ai from "./ai.js";
import { hasOpenRouter, activeModel, callOpenRouter } from "./openrouter.js";

// Initialise schema + seed (no-op if already populated).
seedAll();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Wrap async handlers so rejected promises reach the error middleware.
const h =
  (fn: (req: Request, res: Response) => unknown) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

const notFound = (res: Response, msg: string) => res.status(404).json({ error: msg });

// ── Health / AI status ───────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "capa-ai-server" }));
app.get("/api/ai/status", (_req, res) =>
  res.json({ configured: hasOpenRouter(), model: hasOpenRouter() ? activeModel() : null }),
);

// ── Personas ─────────────────────────────────────────────────────────────────
app.get("/api/personas", (_req, res) => res.json(repo.getPersonas()));

// ── Source records ───────────────────────────────────────────────────────────
app.get("/api/source-records", (_req, res) => res.json(repo.getSourceRecords()));
app.get("/api/source-records/:findingId", (req, res) => {
  const rec = repo.getSourceRecordByFinding(req.params.findingId);
  return rec ? res.json(rec) : notFound(res, "Source record not found.");
});

// ── Findings ─────────────────────────────────────────────────────────────────
app.get("/api/findings", (_req, res) => res.json(repo.getFindings()));
app.get("/api/findings/:id", (req, res) => {
  const f = repo.getFinding(req.params.id);
  return f ? res.json(f) : notFound(res, "Finding not found.");
});

// ── CAPA cases ───────────────────────────────────────────────────────────────
app.get("/api/capas", (_req, res) => res.json(repo.getCapas()));
app.get("/api/capas/:id", (req, res) => {
  const c = repo.getCapa(req.params.id);
  return c ? res.json(c) : notFound(res, "CAPA not found.");
});
app.get("/api/capas/by-finding/:findingId", (req, res) => {
  const c = repo.getCapaByFinding(req.params.findingId);
  return c ? res.json(c) : notFound(res, "CAPA not found for finding.");
});

// ── Actions ──────────────────────────────────────────────────────────────────
app.get("/api/corrective-actions", (req, res) =>
  res.json(repo.getCorrectiveActions(req.query.capaId as string | undefined)),
);
app.get("/api/preventive-actions", (req, res) =>
  res.json(repo.getPreventiveActions(req.query.capaId as string | undefined)),
);

// ── Audit events ─────────────────────────────────────────────────────────────
app.get("/api/audit-events", (req, res) =>
  res.json(
    repo.getAuditEvents({
      capaId: req.query.capaId as string | undefined,
      findingId: req.query.findingId as string | undefined,
    }),
  ),
);
// Client-only events (section edits, Nova suggestion accept/edit) are written
// here; lifecycle events are still logged server-side inside logic.ts.
app.post(
  "/api/audit-events",
  h((req, res) => res.status(201).json(repo.addAuditEvent(req.body ?? {}))),
);

// ── Notifications ────────────────────────────────────────────────────────────
app.get("/api/notifications", (req, res) =>
  res.json(repo.getNotifications(req.query.personaId as string | undefined)),
);
app.post(
  "/api/notifications",
  h((req, res) => res.status(201).json(repo.addNotification(req.body ?? {}))),
);
app.post("/api/notifications/:id/read", (req, res) => {
  repo.markNotificationRead(req.params.id);
  res.json({ ok: true });
});
app.post("/api/notifications/read-all", (req, res) => {
  if (req.body?.personaId) repo.markAllNotificationsRead(req.body.personaId);
  res.json({ ok: true });
});

// ── Dashboard stats ──────────────────────────────────────────────────────────
app.get("/api/dashboard", (_req, res) => {
  const findings = repo.getFindings();
  const capas = repo.getCapas();
  const openStatuses = ["draft", "pending_review", "revision_requested", "investigation", "approval"];
  const openCapas = capas.filter((c) => openStatuses.includes(c.status)).length;
  const closed = capas.filter((c) => c.status === "closed").length;
  const overdueCapas = findings.filter((f) => f.status === "overdue").length;
  const effectivenessRate = capas.length ? Math.round((closed / capas.length) * 100) : 0;
  res.json({
    totalFindingsMTD: findings.length,
    openCapas,
    overdueCapas,
    effectivenessRate,
  });
});

// ── CAPA intake / creation ───────────────────────────────────────────────────
app.post(
  "/api/capas/from-finding",
  h((req, res) => {
    const { findingId, type } = req.body ?? {};
    if (!findingId || !type) return res.status(400).json({ error: "findingId and type are required." });
    const capa = logic.createCAPAFromFinding(findingId, type);
    return capa ? res.status(201).json(capa) : notFound(res, "Finding not found.");
  }),
);

app.post(
  "/api/capas/intake",
  h((req, res) => {
    const capa = logic.submitIntake(req.body ?? {});
    return capa ? res.json(capa) : res.status(400).json({ error: "Unable to submit intake." });
  }),
);

app.post(
  "/api/capas/:id/intake-decision",
  h((req, res) => {
    const { reviewerPersonaId, decision, notes, actor } = req.body ?? {};
    const result = logic.recordIntakeDecision(req.params.id, reviewerPersonaId, decision, notes, actor ?? reviewerPersonaId);
    return result.ok ? res.json(result.capa) : res.status(409).json({ error: "Intake decision rejected." });
  }),
);

// ── 8D step updates ──────────────────────────────────────────────────────────
app.patch(
  "/api/capas/:id/problem",
  h((req, res) => {
    const c = logic.updateProblemStatement(req.params.id, req.body?.statement ?? "", req.body?.score ?? {});
    return c ? res.json(c) : notFound(res, "CAPA not found.");
  }),
);
app.patch(
  "/api/capas/:id/containment",
  h((req, res) => {
    const c = logic.updateContainmentAction(req.params.id, req.body?.action ?? {}, req.body?.score ?? {});
    return c ? res.json(c) : notFound(res, "CAPA not found.");
  }),
);
app.patch(
  "/api/capas/:id/rca",
  h((req, res) => {
    const c = logic.updateRCA(req.params.id, req.body?.rca ?? {}, req.body?.score ?? {});
    return c ? res.json(c) : notFound(res, "CAPA not found.");
  }),
);
app.patch(
  "/api/capas/:id/step",
  h((req, res) => {
    const c = logic.updateCurrentStep(req.params.id, req.body?.step);
    return c ? res.json(c) : notFound(res, "CAPA not found.");
  }),
);
app.patch(
  "/api/capas/:id/score",
  h((req, res) => {
    const c = logic.updateScore(req.params.id, req.body?.score ?? {});
    return c ? res.json(c) : notFound(res, "CAPA not found.");
  }),
);

// ── Corrective / preventive actions ──────────────────────────────────────────
app.post(
  "/api/capas/:id/corrective-actions",
  h((req, res) => res.status(201).json(logic.addCA(req.params.id, req.body?.action ?? req.body ?? {}))),
);
app.patch(
  "/api/corrective-actions/:actionId",
  h((req, res) => {
    const a = logic.updateCAStatus(req.params.actionId, req.body?.status);
    return a ? res.json(a) : notFound(res, "Corrective action not found.");
  }),
);
app.delete("/api/corrective-actions/:actionId", (req, res) => {
  logic.removeCA(req.params.actionId);
  res.json({ ok: true });
});
app.post(
  "/api/capas/:id/preventive-actions",
  h((req, res) => res.status(201).json(logic.addPA(req.params.id, req.body?.action ?? req.body ?? {}))),
);
app.patch(
  "/api/preventive-actions/:actionId",
  h((req, res) => {
    const a = logic.updatePAStatus(req.params.actionId, req.body?.status);
    return a ? res.json(a) : notFound(res, "Preventive action not found.");
  }),
);
app.delete("/api/preventive-actions/:actionId", (req, res) => {
  logic.removePA(req.params.actionId);
  res.json({ ok: true });
});

// ── Verification / approvals / close ─────────────────────────────────────────
app.post(
  "/api/capas/:id/verification",
  h((req, res) => {
    const verification = req.body?.verification ?? req.body ?? {};
    const c =
      req.body?.complete === false
        ? logic.saveVerificationDraft(req.params.id, verification)
        : logic.completeVerification(req.params.id, verification);
    return c ? res.json(c) : notFound(res, "CAPA not found.");
  }),
);
app.post(
  "/api/capas/:id/approvals",
  h((req, res) => {
    const { stage, approval, actor } = req.body ?? {};
    const result = logic.recordApproval(req.params.id, stage, approval, actor ?? approval?.approverPersonaId);
    if (result.ok) return res.json(result.capa);
    if (result.notFound) return notFound(res, `CAPA ${req.params.id} not found.`);
    return res.status(409).json({ error: result.reason ?? "Approval could not be recorded." });
  }),
);
app.post(
  "/api/capas/:id/sign-off",
  h((req, res) => {
    const { approval, actor } = req.body ?? {};
    const result = logic.approveSignOff(req.params.id, approval, actor ?? approval?.approverPersonaId);
    if (result.ok) return res.json(result.capa);
    if (result.notFound) return notFound(res, `CAPA ${req.params.id} not found.`);
    return res.status(409).json({ error: result.reason ?? "Sign-off could not be recorded." });
  }),
);
app.post(
  "/api/capas/:id/close",
  h((req, res) => {
    const c = logic.closeCAPA(req.params.id);
    return c ? res.json(c) : notFound(res, "CAPA not found.");
  }),
);

// ── AI: premade suggestions menu ─────────────────────────────────────────────
app.get("/api/ai/suggestions", (req, res) => {
  const section = req.query.section as string | undefined;
  if (!section) return res.status(400).json({ error: "section is required." });
  const data = repo.getAiSuggestion(section, {
    capaType: req.query.capaType as string | undefined,
    capaId: req.query.capaId as string | undefined,
  });
  return data !== undefined ? res.json({ section, data }) : notFound(res, "No suggestion found.");
});

// ── AI: interactive 5 Whys ───────────────────────────────────────────────────
app.post(
  "/api/ai/5whys/start",
  h(async (req, res) => {
    if (!req.body?.capaId) return res.status(400).json({ error: "capaId is required." });
    res.json(await ai.startFiveWhys(req.body.capaId));
  }),
);
app.post(
  "/api/ai/5whys/:sessionId/answer",
  h(async (req, res) => {
    const { nodeId, answer } = req.body ?? {};
    if (!nodeId) return res.status(400).json({ error: "nodeId is required." });
    res.json(await ai.answerFiveWhys(req.params.sessionId, nodeId, answer ?? ""));
  }),
);
app.get("/api/ai/5whys/session/:sessionId", (req, res) => {
  const s = repo.getFiveWhysSession(req.params.sessionId);
  return s ? res.json(s) : notFound(res, "Session not found.");
});
app.get("/api/ai/5whys", (req, res) => {
  const capaId = req.query.capaId as string | undefined;
  if (!capaId) return res.status(400).json({ error: "capaId is required." });
  const s = repo.getLatestFiveWhysByCapa(capaId);
  return res.json(s ?? null);
});

// ── AI: live chat ────────────────────────────────────────────────────────────
app.post(
  "/api/ai/chat",
  h(async (req, res) => {
    const { capaId, step, message } = req.body ?? {};
    if (!message) return res.status(400).json({ error: "message is required." });
    res.json(await ai.chat({ capaId, step: step ?? "global", message }));
  }),
);
app.get("/api/ai/chat", (req, res) => {
  res.json(ai.chatHistory(req.query.capaId as string | undefined, (req.query.step as string) ?? "global"));
});

// ── Compatibility bridge: legacy /api/nova proxy ─────────────────────────────
// Keeps the pre-migration Nova provider working (it POSTs {task, messages}).
app.get("/api/nova", (_req, res) =>
  res.json({ ok: true, service: "nova-openrouter-proxy", status: hasOpenRouter() ? "configured" : "missing_openrouter_api_key" }),
);
app.post(
  "/api/nova",
  h(async (req, res) => {
    const body = req.body ?? {};
    if (!Array.isArray(body.messages)) return res.status(400).json({ ok: false, error: "Invalid Nova task request." });
    if (!hasOpenRouter()) return res.status(503).json({ ok: false, error: "OPENROUTER_API_KEY is not configured." });
    try {
      const content = await callOpenRouter(body.messages, {
        maxTokens: body.maxTokens ?? 1200,
        temperature: body.temperature ?? 0.2,
      });
      return res.json({ ok: true, task: body.task, model: activeModel(), content });
    } catch (error) {
      return res.status(502).json({ ok: false, error: error instanceof Error ? error.message : "Nova proxy failed." });
    }
  }),
);

// ── Admin: reset demo data ───────────────────────────────────────────────────
app.post("/api/admin/reset", (_req, res) => {
  seedAll({ reset: true });
  res.json({ ok: true, reseeded: true });
});

// ── Error handler ────────────────────────────────────────────────────────────
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error("[api error]", err);
  res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error." });
});

const PORT = Number(process.env.API_PORT ?? 4000);
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[capa-ai-server] listening on http://localhost:${PORT} (OpenRouter: ${hasOpenRouter() ? "configured" : "premade-only"})`);
});
