// React Query write hooks. Mutations are async; call sites use `mutateAsync`
// when they need the result (e.g. navigate to a freshly created CAPA).
//
// Permission-gated actions (intake decision, approvals, sign-off) read the
// active persona from the persona store and forward it as `actor` — the server
// performs the same gate the old Zustand store used to.

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  api,
  type ContainmentInput,
  type IntakeSubmission,
  type NewAuditEvent,
  type NewCorrectiveAction,
  type NewNotification,
  type NewPreventiveAction,
} from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { usePersonaStore } from "@/store/usePersonaStore";
import type {
  ApprovalEvent,
  ApprovalStage,
  CAPACase,
  CAPAType,
  CorrectiveAction,
  EightDStep,
  IntakeDecision,
  PreventiveAction,
  QualityScore,
  RCAData,
  VerificationData,
} from "@/types";
import type { PersonaID } from "@/types/persona";

const activePersona = (): PersonaID => usePersonaStore.getState().activePersonaId;

/**
 * Invalidate every server-derived data query (everything except the static
 * personas / AI-status lookups). The demo dataset is tiny, so a broad refetch
 * keeps every view consistent without hunting for missed keys.
 */
function invalidateWorld(qc: QueryClient) {
  return qc.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      return (
        Array.isArray(key) &&
        key[0] === "capa-ai" &&
        key[1] !== "personas" &&
        key[1] !== "ai-status"
      );
    },
  });
}

/** Prime the CAPA detail cache with a freshly returned case for snappy nav. */
function primeCapa(qc: QueryClient, capa: CAPACase | undefined) {
  if (capa?.id) qc.setQueryData(queryKeys.capa(capa.id), capa);
}

// ── CAPA creation / intake ───────────────────────────────────────────────────

export function useCreateCapaFromFinding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { findingId: string; type: CAPAType }) =>
      api.createCapaFromFinding(vars.findingId, vars.type),
    onSuccess: (capa) => {
      primeCapa(qc, capa);
      void invalidateWorld(qc);
    },
  });
}

export function useSubmitIntake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: IntakeSubmission) => api.submitIntake(payload),
    onSuccess: (capa) => {
      primeCapa(qc, capa);
      void invalidateWorld(qc);
    },
  });
}

export function useRecordIntakeDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      capaId: string;
      reviewerPersonaId: PersonaID;
      decision: IntakeDecision;
      notes?: string;
    }) =>
      api.recordIntakeDecision(vars.capaId, {
        reviewerPersonaId: vars.reviewerPersonaId,
        decision: vars.decision,
        notes: vars.notes,
        actor: activePersona(),
      }),
    onSuccess: (capa) => {
      primeCapa(qc, capa);
      void invalidateWorld(qc);
    },
  });
}

// ── 8D step updates ──────────────────────────────────────────────────────────

export function useUpdateProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { capaId: string; statement: string; score: QualityScore }) =>
      api.updateProblem(vars.capaId, vars.statement, vars.score),
    onSuccess: (capa) => {
      primeCapa(qc, capa);
      void invalidateWorld(qc);
    },
  });
}

export function useUpdateContainment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { capaId: string; action: ContainmentInput; score: QualityScore }) =>
      api.updateContainment(vars.capaId, vars.action, vars.score),
    onSuccess: (capa) => {
      primeCapa(qc, capa);
      void invalidateWorld(qc);
    },
  });
}

export function useUpdateRca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { capaId: string; rca: RCAData; score: QualityScore }) =>
      api.updateRca(vars.capaId, vars.rca, vars.score),
    onSuccess: (capa) => {
      primeCapa(qc, capa);
      void invalidateWorld(qc);
    },
  });
}

export function useUpdateStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { capaId: string; step: EightDStep }) =>
      api.updateStep(vars.capaId, vars.step),
    onSuccess: (capa) => {
      primeCapa(qc, capa);
      void invalidateWorld(qc);
    },
  });
}

export function useUpdateScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { capaId: string; score: QualityScore }) =>
      api.updateScore(vars.capaId, vars.score),
    onSuccess: (capa) => {
      primeCapa(qc, capa);
      void invalidateWorld(qc);
    },
  });
}

// ── Corrective actions ───────────────────────────────────────────────────────

export function useAddCorrectiveAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { capaId: string; action: NewCorrectiveAction }) =>
      api.addCorrectiveAction(vars.capaId, vars.action),
    onSuccess: () => void invalidateWorld(qc),
  });
}

export function useUpdateCorrectiveAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { actionId: string; status: CorrectiveAction["status"] }) =>
      api.updateCorrectiveAction(vars.actionId, vars.status),
    onSuccess: () => void invalidateWorld(qc),
  });
}

export function useRemoveCorrectiveAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { actionId: string }) => api.removeCorrectiveAction(vars.actionId),
    onSuccess: () => void invalidateWorld(qc),
  });
}

// ── Preventive actions ───────────────────────────────────────────────────────

export function useAddPreventiveAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { capaId: string; action: NewPreventiveAction }) =>
      api.addPreventiveAction(vars.capaId, vars.action),
    onSuccess: () => void invalidateWorld(qc),
  });
}

export function useUpdatePreventiveAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { actionId: string; status: PreventiveAction["status"] }) =>
      api.updatePreventiveAction(vars.actionId, vars.status),
    onSuccess: () => void invalidateWorld(qc),
  });
}

export function useRemovePreventiveAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { actionId: string }) => api.removePreventiveAction(vars.actionId),
    onSuccess: () => void invalidateWorld(qc),
  });
}

// ── Verification / approvals / close ─────────────────────────────────────────

export function useCompleteVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { capaId: string; verification: VerificationData }) =>
      api.completeVerification(vars.capaId, vars.verification),
    onSuccess: (capa) => {
      primeCapa(qc, capa);
      void invalidateWorld(qc);
    },
  });
}

export function useRecordApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { capaId: string; stage: ApprovalStage; approval: ApprovalEvent }) =>
      api.recordApproval(vars.capaId, vars.stage, vars.approval, activePersona()),
    onSuccess: (capa) => {
      primeCapa(qc, capa);
      void invalidateWorld(qc);
    },
  });
}

export function useApproveSignOff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { capaId: string; approval: ApprovalEvent }) =>
      api.approveSignOff(vars.capaId, vars.approval, activePersona()),
    onSuccess: (capa) => {
      primeCapa(qc, capa);
      void invalidateWorld(qc);
    },
  });
}

export function useCloseCapa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { capaId: string }) => api.closeCapa(vars.capaId),
    onSuccess: (capa) => {
      primeCapa(qc, capa);
      void invalidateWorld(qc);
    },
  });
}

// ── Notifications ────────────────────────────────────────────────────────────

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string }) => api.markNotificationRead(vars.id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...queryKeys.all, "notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars?: { personaId?: PersonaID }) =>
      api.markAllNotificationsRead(vars?.personaId ?? activePersona()),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...queryKeys.all, "notifications"] }),
  });
}

// ── Client-authored audit / notifications ────────────────────────────────────
// Section edits (D1–D3) and Nova suggestion accept/edit events have no server
// lifecycle hook, so the client writes them directly through these.

export function useAddAuditEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (event: NewAuditEvent) => api.addAuditEvent(event),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...queryKeys.all, "audit-events"] }),
  });
}

export function useAddNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notification: NewNotification) => api.addNotification(notification),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...queryKeys.all, "notifications"] }),
  });
}

// ── AI: interactive 5 Whys ───────────────────────────────────────────────────

export function useStartFiveWhys() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { capaId: string }) => api.startFiveWhys(vars.capaId),
    onSuccess: (session) => {
      qc.setQueryData(queryKeys.fiveWhysSession(session.id), session);
      qc.setQueryData(queryKeys.fiveWhysLatest(session.capaId), session);
    },
  });
}

export function useAnswerFiveWhys() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { sessionId: string; nodeId: string; answer: string }) =>
      api.answerFiveWhys(vars.sessionId, vars.nodeId, vars.answer),
    onSuccess: (session) => {
      qc.setQueryData(queryKeys.fiveWhysSession(session.id), session);
      qc.setQueryData(queryKeys.fiveWhysLatest(session.capaId), session);
    },
  });
}

// ── AI: live chat ────────────────────────────────────────────────────────────

export function useChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { capaId?: string; step: string; message: string }) => api.chat(vars),
    onSuccess: (_reply, vars) =>
      qc.invalidateQueries({ queryKey: queryKeys.chatHistory(vars.capaId, vars.step) }),
  });
}

// ── Admin ────────────────────────────────────────────────────────────────────

export function useResetDemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.resetDemo(),
    onSuccess: () => qc.invalidateQueries(),
  });
}
