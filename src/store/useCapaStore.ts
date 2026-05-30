import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  capaCases as initialCapaCases,
  correctiveActions as initialCorrectiveActions,
  findings as initialFindings,
  prefills,
  preventiveActions as initialPreventiveActions,
} from "@/mock-data";
import type {
  ApprovalEvent,
  CAPACase,
  CAPAType,
  CorrectiveAction,
  EightDStep,
  PreventiveAction,
  QualityScore,
  RCAData,
  VerificationData,
} from "@/types";
import type { Finding } from "@/types/finding";
import { useAuditTrailStore } from "@/store/useAuditTrailStore";
import { useNotificationStore } from "@/store/useNotificationStore";

interface CapaStore {
  capas: CAPACase[];
  findings: Finding[];
  correctiveActions: CorrectiveAction[];
  preventiveActions: PreventiveAction[];
  createCAPAFromFinding: (findingId: string, type: CAPAType) => CAPACase | undefined;
  updateProblemStatement: (capaId: string, statement: string, score: QualityScore) => void;
  updateContainmentAction: (
    capaId: string,
    action: {
      description: string;
      pic: string;
      dueDate: string;
    },
    score: QualityScore,
  ) => void;
  updateRCA: (capaId: string, rca: RCAData, score: QualityScore) => void;
  updateCurrentStep: (capaId: string, step: EightDStep) => void;
  updateScore: (capaId: string, score: QualityScore) => void;
  addCA: (capaId: string, action: Omit<CorrectiveAction, "id" | "capaId"> & { id?: string }) => CorrectiveAction;
  updateCAStatus: (actionId: string, status: CorrectiveAction["status"]) => void;
  addPA: (capaId: string, action: Omit<PreventiveAction, "id" | "capaId"> & { id?: string }) => PreventiveAction;
  completeVerification: (capaId: string, verification: VerificationData) => void;
  approveSignOff: (capaId: string, approval: ApprovalEvent) => void;
  closeCAPA: (capaId: string) => void;
  getCAPAById: (capaId: string) => CAPACase | undefined;
  getFindingById: (findingId: string) => Finding | undefined;
  getActionsByCAPA: (capaId: string) => {
    correctiveActions: CorrectiveAction[];
    preventiveActions: PreventiveAction[];
  };
  resetCAPAStore: () => void;
}

function createInitialCAPA(finding: Finding, type: CAPAType): CAPACase {
  const now = new Date().toISOString();
  const id = `CAPA-${finding.id.replace(/^(DEV|AUD|CMP)-/, "")}`;

  return {
    id,
    findingId: finding.id,
    type,
    title: finding.shortDescription,
    preFill: prefills[type],
    gateAnswers: [],
    score: {
      problemSpecificity: 0,
      rootCauseDepth: 0,
      effectiveness: 0,
      containment: 0,
      total: 0,
      isAuditReady: false,
    },
    impact: {
      severity: "Major",
      totalWeight: 0,
      factors: [],
      rationale: "Nova will classify this finding during intake.",
      computedAt: now,
    },
    rca: {
      method: type === "audit" ? "fishbone" : type === "complaint" ? "decision_tree" : "5whys",
      confirmedRootCauses: [],
    },
    correctiveActions: [],
    preventiveActions: [],
    verification: {
      evidenceFileNames: [],
    },
    approvals: [],
    auditEvents: [],
    suggestions: [],
    status: "draft",
    currentStep: "problem",
    createdAt: now,
    updatedAt: now,
    createdBy: type === "deviation" ? "initiator" : "qa_deviation",
    assignedTo: "qa_deviation",
    department: finding.department,
  };
}

function attachActions(
  capa: CAPACase,
  correctiveActions: CorrectiveAction[],
  preventiveActions: PreventiveAction[],
): CAPACase {
  return {
    ...capa,
    correctiveActions: correctiveActions.filter((action) => action.capaId === capa.id),
    preventiveActions: preventiveActions.filter((action) => action.capaId === capa.id),
  };
}

export const useCapaStore = create<CapaStore>()(
  persist(
    (set, get) => ({
      capas: structuredClone(initialCapaCases),
      findings: structuredClone(initialFindings),
      correctiveActions: structuredClone(initialCorrectiveActions),
      preventiveActions: structuredClone(initialPreventiveActions),
      createCAPAFromFinding: (findingId, type) => {
        const existing = get().capas.find((capa) => capa.findingId === findingId);
        if (existing) return existing;

        const finding = get().findings.find((record) => record.id === findingId);
        if (!finding) return undefined;

        const newCAPA = createInitialCAPA(finding, type);
        set((state) => ({
          capas: [newCAPA, ...state.capas],
          findings: state.findings.map((record) =>
            record.id === findingId
              ? {
                  ...record,
                  linkedCapaId: newCAPA.id,
                  status: "capa_in_progress",
                }
              : record,
          ),
        }));

        useAuditTrailStore.getState().addEvent({
          actorName: "Nova",
          actorRole: "AI Coach",
          domain: "system",
          eventType: "source_imported",
          action: `Created ${newCAPA.id} from finding ${findingId}.`,
          capaId: newCAPA.id,
          findingId,
        });

        useNotificationStore.getState().addNotification({
          recipientPersonaId: "qa_deviation",
          type: "capa_update",
          title: "CAPA created from finding",
          description: `${newCAPA.id} was created and is ready for QA review.`,
          capaId: newCAPA.id,
          actionUrl: `/capa/${newCAPA.id}`,
        });

        return newCAPA;
      },
      updateProblemStatement: (capaId, statement, score) =>
        set((state) => ({
          capas: state.capas.map((capa) =>
            capa.id === capaId
              ? {
                  ...capa,
                  gateAnswers: [
                    ...capa.gateAnswers.filter((answer) => answer.questionId !== "observation"),
                    {
                      questionId: "observation",
                      question: "What happened, when, where, and what product or system was affected?",
                      answer: statement,
                      novaScoreContribution: score.problemSpecificity,
                      needsImprovement: score.problemSpecificity < 20,
                      improvementHint:
                        score.problemSpecificity < 20
                          ? "Add date, location, equipment/system reference, batch or lot, and measurable observation."
                          : undefined,
                    },
                  ],
                  score,
                  updatedAt: new Date().toISOString(),
                }
              : capa,
          ),
        })),
      updateContainmentAction: (capaId, action, score) =>
        set((state) => ({
          capas: state.capas.map((capa) =>
            capa.id === capaId
              ? {
                  ...capa,
                  gateAnswers: [
                    ...capa.gateAnswers.filter((answer) => answer.questionId !== "containment"),
                    {
                      questionId: "containment",
                      question: "What immediate containment action was taken, by whom, and by when?",
                      answer: `${action.description}\nPIC: ${action.pic}\nDue date: ${action.dueDate}`,
                      novaScoreContribution: score.containment,
                      needsImprovement: score.containment < 20,
                      improvementHint:
                        score.containment < 20
                          ? "Add immediate hold, quarantine, restriction, PIC, and a future due date."
                          : undefined,
                    },
                  ],
                  score,
                  updatedAt: new Date().toISOString(),
                }
              : capa,
          ),
        })),
      updateRCA: (capaId, rca, score) =>
        set((state) => ({
          capas: state.capas.map((capa) =>
            capa.id === capaId
              ? {
                  ...capa,
                  rca,
                  score,
                  updatedAt: new Date().toISOString(),
                }
              : capa,
          ),
        })),
      updateCurrentStep: (capaId, step) =>
        set((state) => ({
          capas: state.capas.map((capa) =>
            capa.id === capaId
              ? {
                  ...capa,
                  currentStep: step,
                  status: step === "signoff" ? "approval" : "investigation",
                  updatedAt: new Date().toISOString(),
                }
              : capa,
          ),
        })),
      updateScore: (capaId, score) =>
        set((state) => ({
          capas: state.capas.map((capa) =>
            capa.id === capaId
              ? {
                  ...capa,
                  score,
                  updatedAt: new Date().toISOString(),
                }
              : capa,
          ),
        })),
      addCA: (capaId, action) => {
        const newAction: CorrectiveAction = {
          ...action,
          id: action.id ?? `CA-${capaId.replace("CAPA-", "")}-${Date.now()}`,
          capaId,
        };

        set((state) => ({
          correctiveActions: [...state.correctiveActions, newAction],
        }));

        useAuditTrailStore.getState().addEvent({
          actorName: "Nova Demo User",
          actorRole: "CAPA User",
          domain: "system",
          eventType: "corrective_action_added",
          action: `Corrective action ${newAction.id} was added to ${capaId}.`,
          capaId,
        });

        return newAction;
      },
      updateCAStatus: (actionId, status) => {
        const completedAt =
          status === "completed" || status === "verified" ? new Date().toISOString() : undefined;

        set((state) => ({
          correctiveActions: state.correctiveActions.map((action) =>
            action.id === actionId
              ? {
                  ...action,
                  status,
                  completedAt,
                }
              : action,
          ),
        }));

        useAuditTrailStore.getState().addEvent({
          actorName: "Nova Demo User",
          actorRole: "CAPA User",
          domain: "system",
          eventType: "corrective_action_added",
          action: `Corrective action ${actionId} status updated to ${status}.`,
        });
      },
      addPA: (capaId, action) => {
        const newAction: PreventiveAction = {
          ...action,
          id: action.id ?? `PA-${capaId.replace("CAPA-", "")}-${Date.now()}`,
          capaId,
        };

        set((state) => ({
          preventiveActions: [...state.preventiveActions, newAction],
        }));

        useAuditTrailStore.getState().addEvent({
          actorName: "Nova Demo User",
          actorRole: "CAPA User",
          domain: "system",
          eventType: "preventive_action_added",
          action: `Preventive action ${newAction.id} was added to ${capaId}.`,
          capaId,
        });

        return newAction;
      },
      completeVerification: (capaId, verification) => {
        set((state) => ({
          capas: state.capas.map((capa) =>
            capa.id === capaId
              ? {
                  ...capa,
                  verification: {
                    ...verification,
                    verifiedAt: verification.verifiedAt ?? new Date().toISOString(),
                  },
                  updatedAt: new Date().toISOString(),
                }
              : capa,
          ),
        }));

        useAuditTrailStore.getState().addEvent({
          actorName: "Nova Demo User",
          actorRole: "CAPA User",
          domain: "system",
          eventType: "verification_completed",
          action: `Verification was completed for ${capaId}.`,
          capaId,
        });
      },
      approveSignOff: (capaId, approval) => {
        set((state) => ({
          capas: state.capas.map((capa) =>
            capa.id === capaId
              ? {
                  ...capa,
                  approvals: [
                    ...capa.approvals.filter(
                      (event) => event.approverPersonaId !== approval.approverPersonaId,
                    ),
                    {
                      ...approval,
                      signedAt: approval.signedAt ?? new Date().toISOString(),
                    },
                  ],
                  updatedAt: new Date().toISOString(),
                }
              : capa,
          ),
        }));

        useAuditTrailStore.getState().addEvent({
          actorPersonaId: approval.approverPersonaId,
          actorName: approval.approverName,
          actorRole: approval.role,
          domain: "system",
          eventType: "esignature_submitted",
          action: `${approval.approverName} ${approval.decision} ${capaId} with electronic signature.`,
          capaId,
        });
      },
      closeCAPA: (capaId) => {
        const capa = get().capas.find((record) => record.id === capaId);
        if (!capa) return;

        set((state) => ({
          capas: state.capas.map((record) =>
            record.id === capaId
              ? {
                  ...record,
                  status: "closed",
                  currentStep: "signoff",
                  score: {
                    ...record.score,
                    total: Math.max(record.score.total, 80),
                    isAuditReady: true,
                  },
                  updatedAt: new Date().toISOString(),
                }
              : record,
          ),
          findings: state.findings.map((finding) =>
            finding.id === capa.findingId ? { ...finding, status: "capa_closed" } : finding,
          ),
        }));

        useAuditTrailStore.getState().addEvent({
          actorName: "System",
          actorRole: "Demo Runtime",
          domain: "system",
          eventType: "capa_closed",
          action: `${capaId} was marked as Audit Ready and Closed.`,
          capaId,
          findingId: capa.findingId,
        });
      },
      getCAPAById: (capaId) => {
        const state = get();
        const capa = state.capas.find((record) => record.id === capaId);
        return capa
          ? attachActions(capa, state.correctiveActions, state.preventiveActions)
          : undefined;
      },
      getFindingById: (findingId) => get().findings.find((finding) => finding.id === findingId),
      getActionsByCAPA: (capaId) => ({
        correctiveActions: get().correctiveActions.filter((action) => action.capaId === capaId),
        preventiveActions: get().preventiveActions.filter((action) => action.capaId === capaId),
      }),
      resetCAPAStore: () =>
        set({
          capas: structuredClone(initialCapaCases),
          findings: structuredClone(initialFindings),
          correctiveActions: structuredClone(initialCorrectiveActions),
          preventiveActions: structuredClone(initialPreventiveActions),
        }),
    }),
    {
      name: "ai-coach-nova-capa",
    },
  ),
);
