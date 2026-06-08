// Typed fetch client for the CAPA Express/SQLite backend.
// All data + AI traffic flows through `/api/*` (Vite proxies to the API server).
// Mutations are async by design — the previous Zustand store is being retired.

import type {
  ApprovalEvent,
  ApprovalStage,
  AuditEvent,
  CAPACase,
  CAPAType,
  CorrectiveAction,
  DashboardStats,
  Finding,
  GateAnswer,
  ImpactClassification,
  IntakeDecision,
  Notification,
  Persona,
  PreFillContext,
  PreventiveAction,
  QualityScore,
  RCAData,
  Severity,
  VerificationData,
} from "@/types";
import type { PersonaID } from "@/types/persona";

const API_BASE = "/api";

// ── Low-level request helper ─────────────────────────────────────────────────

type Query = Record<string, string | number | boolean | undefined | null>;

function withQuery(path: string, query?: Query): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json().catch(() => undefined)) as unknown;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed (${response.status}) for ${method} ${path}`;
    throw new Error(message);
  }

  return payload as T;
}

const get = <T>(path: string, query?: Query) => request<T>("GET", withQuery(path, query));
const post = <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {});
const patch = <T>(path: string, body?: unknown) => request<T>("PATCH", path, body ?? {});
const del = <T>(path: string) => request<T>("DELETE", path);

// ── Shared payload / response shapes ─────────────────────────────────────────

export interface AiStatus {
  configured: boolean;
  model: string | null;
}

export interface IntakeSubmission {
  findingId: string;
  type: CAPAType;
  title: string;
  severity: Severity;
  gateAnswers: GateAnswer[];
  impact?: ImpactClassification;
}

export interface FiveWhysNode {
  id: string;
  level: number;
  question: string;
  novaSuggestion: string;
  novaCitations: unknown[];
  userAnswer: string;
  status: "pending" | "accepted" | "edited" | "replaced";
}

export interface FiveWhysSession {
  id: string;
  capaId: string;
  method: "5whys";
  status: "active" | "complete";
  source: "openrouter" | "premade";
  problemStatement: string;
  nodes: FiveWhysNode[];
  confirmedRootCauses: string[];
  createdAt: string;
  updatedAt: string;
}

export type ChatSource = "openrouter" | "premade";

export interface ChatReply {
  reply: string;
  source: ChatSource;
}

export interface ChatMessage {
  id: string;
  thread: string;
  capaId: string | null;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AiSuggestionResult<T = unknown> {
  section: string;
  data: T;
}

export type ContainmentInput = { description: string; pic: string; dueDate: string };
export type NewCorrectiveAction = Omit<CorrectiveAction, "id" | "capaId"> & { id?: string };
export type NewPreventiveAction = Omit<PreventiveAction, "id" | "capaId"> & { id?: string };

// Client-authored events (section edits + Nova suggestion accept/edit). The
// server stamps id/timestamp/createdAt/read when omitted.
export type NewAuditEvent = Omit<AuditEvent, "id" | "timestamp"> &
  Partial<Pick<AuditEvent, "id" | "timestamp">>;
export type NewNotification = Omit<Notification, "id" | "createdAt" | "read"> &
  Partial<Pick<Notification, "id" | "createdAt" | "read">>;

// ── API surface ──────────────────────────────────────────────────────────────

export const api = {
  // Health / AI status
  health: () => get<{ ok: boolean; service: string }>("/health"),
  aiStatus: () => get<AiStatus>("/ai/status"),

  // Personas
  personas: () => get<Persona[]>("/personas"),

  // Source records (mock external importers)
  sourceRecords: () => get<unknown[]>("/source-records"),
  sourceRecord: (findingId: string) => get<unknown>(`/source-records/${findingId}`),

  // Findings
  findings: () => get<Finding[]>("/findings"),
  finding: (id: string) => get<Finding>(`/findings/${id}`),

  // CAPA cases
  capas: () => get<CAPACase[]>("/capas"),
  capa: (id: string) => get<CAPACase>(`/capas/${id}`),
  capaByFinding: (findingId: string) => get<CAPACase>(`/capas/by-finding/${findingId}`),

  // Actions
  correctiveActions: (capaId?: string) =>
    get<CorrectiveAction[]>("/corrective-actions", { capaId }),
  preventiveActions: (capaId?: string) =>
    get<PreventiveAction[]>("/preventive-actions", { capaId }),

  // Audit + notifications + dashboard
  auditEvents: (filter?: { capaId?: string; findingId?: string }) =>
    get<AuditEvent[]>("/audit-events", filter),
  addAuditEvent: (event: NewAuditEvent) => post<AuditEvent>("/audit-events", event),
  notifications: (personaId?: PersonaID) => get<Notification[]>("/notifications", { personaId }),
  addNotification: (notification: NewNotification) =>
    post<Notification>("/notifications", notification),
  dashboard: () => get<DashboardStats>("/dashboard"),

  // CAPA creation / intake
  createCapaFromFinding: (findingId: string, type: CAPAType) =>
    post<CAPACase>("/capas/from-finding", { findingId, type }),
  submitIntake: (payload: IntakeSubmission) => post<CAPACase>("/capas/intake", payload),
  recordIntakeDecision: (
    capaId: string,
    args: { reviewerPersonaId: PersonaID; decision: IntakeDecision; notes?: string; actor: PersonaID },
  ) => post<CAPACase>(`/capas/${capaId}/intake-decision`, args),

  // 8D step updates
  updateProblem: (capaId: string, statement: string, score: QualityScore) =>
    patch<CAPACase>(`/capas/${capaId}/problem`, { statement, score }),
  updateContainment: (capaId: string, action: ContainmentInput, score: QualityScore) =>
    patch<CAPACase>(`/capas/${capaId}/containment`, { action, score }),
  updateRca: (capaId: string, rca: RCAData, score: QualityScore) =>
    patch<CAPACase>(`/capas/${capaId}/rca`, { rca, score }),
  updateStep: (capaId: string, step: CAPACase["currentStep"]) =>
    patch<CAPACase>(`/capas/${capaId}/step`, { step }),
  updateScore: (capaId: string, score: QualityScore) =>
    patch<CAPACase>(`/capas/${capaId}/score`, { score }),

  // Corrective actions
  addCorrectiveAction: (capaId: string, action: NewCorrectiveAction) =>
    post<CorrectiveAction>(`/capas/${capaId}/corrective-actions`, { action }),
  updateCorrectiveAction: (actionId: string, status: CorrectiveAction["status"]) =>
    patch<CorrectiveAction>(`/corrective-actions/${actionId}`, { status }),
  removeCorrectiveAction: (actionId: string) =>
    del<{ ok: boolean }>(`/corrective-actions/${actionId}`),

  // Preventive actions
  addPreventiveAction: (capaId: string, action: NewPreventiveAction) =>
    post<PreventiveAction>(`/capas/${capaId}/preventive-actions`, { action }),
  updatePreventiveAction: (actionId: string, status: PreventiveAction["status"]) =>
    patch<PreventiveAction>(`/preventive-actions/${actionId}`, { status }),
  removePreventiveAction: (actionId: string) =>
    del<{ ok: boolean }>(`/preventive-actions/${actionId}`),

  // Verification / approvals / close
  completeVerification: (capaId: string, verification: VerificationData) =>
    post<CAPACase>(`/capas/${capaId}/verification`, { verification }),
  recordApproval: (capaId: string, stage: ApprovalStage, approval: ApprovalEvent, actor: PersonaID) =>
    post<CAPACase>(`/capas/${capaId}/approvals`, { stage, approval, actor }),
  approveSignOff: (capaId: string, approval: ApprovalEvent, actor: PersonaID) =>
    post<CAPACase>(`/capas/${capaId}/sign-off`, { approval, actor }),
  closeCapa: (capaId: string) => post<CAPACase>(`/capas/${capaId}/close`),

  // Notifications
  markNotificationRead: (id: string) => post<{ ok: boolean }>(`/notifications/${id}/read`),
  markAllNotificationsRead: (personaId: PersonaID) =>
    post<{ ok: boolean }>("/notifications/read-all", { personaId }),

  // AI: premade suggestions
  aiSuggestion: <T = unknown>(
    section: string,
    opts?: { capaType?: CAPAType; capaId?: string },
  ) => get<AiSuggestionResult<T>>("/ai/suggestions", { section, ...opts }),

  // AI: interactive 5 Whys
  startFiveWhys: (capaId: string) => post<FiveWhysSession>("/ai/5whys/start", { capaId }),
  answerFiveWhys: (sessionId: string, nodeId: string, answer: string) =>
    post<FiveWhysSession>(`/ai/5whys/${sessionId}/answer`, { nodeId, answer }),
  fiveWhysSession: (sessionId: string) =>
    get<FiveWhysSession>(`/ai/5whys/session/${sessionId}`),
  latestFiveWhys: (capaId: string) =>
    get<FiveWhysSession | null>("/ai/5whys", { capaId }),

  // AI: live chat
  chat: (args: { capaId?: string; step: string; message: string }) =>
    post<ChatReply>("/ai/chat", args),
  chatHistory: (capaId: string | undefined, step: string) =>
    get<ChatMessage[]>("/ai/chat", { capaId, step }),

  // Source prefill (used by the prefill importer flow)
  prefill: (findingId: string) => get<PreFillContext>(`/source-records/${findingId}`),

  // Admin
  resetDemo: () => post<{ ok: boolean; reseeded: boolean }>("/admin/reset"),
};

export type Api = typeof api;
