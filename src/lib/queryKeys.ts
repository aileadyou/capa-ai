// Centralised React Query key factory. Keep keys here so mutations can
// invalidate precisely and consumers stay consistent.

import type { PersonaID } from "@/types/persona";

export const queryKeys = {
  all: ["capa-ai"] as const,

  personas: () => [...queryKeys.all, "personas"] as const,
  aiStatus: () => [...queryKeys.all, "ai-status"] as const,

  findings: () => [...queryKeys.all, "findings"] as const,
  finding: (id: string) => [...queryKeys.all, "finding", id] as const,

  capas: () => [...queryKeys.all, "capas"] as const,
  capa: (id: string) => [...queryKeys.all, "capa", id] as const,
  capaByFinding: (findingId: string) => [...queryKeys.all, "capa-by-finding", findingId] as const,

  correctiveActions: (capaId?: string) =>
    [...queryKeys.all, "corrective-actions", capaId ?? "all"] as const,
  preventiveActions: (capaId?: string) =>
    [...queryKeys.all, "preventive-actions", capaId ?? "all"] as const,

  auditEvents: (filter?: { capaId?: string; findingId?: string }) =>
    [...queryKeys.all, "audit-events", filter?.capaId ?? null, filter?.findingId ?? null] as const,

  notifications: (personaId?: PersonaID) =>
    [...queryKeys.all, "notifications", personaId ?? "all"] as const,
  dashboard: () => [...queryKeys.all, "dashboard"] as const,

  sourceRecords: () => [...queryKeys.all, "source-records"] as const,
  sourceRecord: (findingId: string) => [...queryKeys.all, "source-record", findingId] as const,

  aiSuggestion: (section: string, capaId?: string, capaType?: string) =>
    [...queryKeys.all, "ai-suggestion", section, capaId ?? null, capaType ?? null] as const,

  fiveWhysLatest: (capaId: string) => [...queryKeys.all, "5whys-latest", capaId] as const,
  fiveWhysSession: (sessionId: string) => [...queryKeys.all, "5whys-session", sessionId] as const,

  chatHistory: (capaId: string | undefined, step: string) =>
    [...queryKeys.all, "chat", capaId ?? "global", step] as const,
};
