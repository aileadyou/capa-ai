import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  capaCases as initialCapaCases,
  correctiveActions as initialCorrectiveActions,
  findings as initialFindings,
  preventiveActions as initialPreventiveActions,
} from "@/mock-data";
import type {
  ApprovalEvent,
  CAPACase,
  CAPAStatus,
  CAPAType,
  CorrectiveAction,
  EightDStep,
  GateAnswer,
  ImpactClassification,
  IntakeDecision,
  IntakeReview,
  PreFillContext,
  PreventiveAction,
  QualityScore,
  RCAData,
  Severity,
  VerificationData,
} from "@/types";
import type { PersonaID } from "@/types/persona";
import type { Finding } from "@/types/finding";
import { useAuditTrailStore } from "@/store/useAuditTrailStore";
import { useNotificationStore } from "@/store/useNotificationStore";

interface CapaStore {
  capas: CAPACase[];
  findings: Finding[];
  correctiveActions: CorrectiveAction[];
  preventiveActions: PreventiveAction[];
  createCAPAFromFinding: (findingId: string, type: CAPAType) => CAPACase | undefined;
  submitIntake: (payload: IntakeSubmission) => CAPACase | undefined;
  recordIntakeDecision: (
    capaId: string,
    reviewerPersonaId: PersonaID,
    decision: IntakeDecision,
    notes?: string,
  ) => void;
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
  removeCA: (actionId: string) => void;
  addPA: (capaId: string, action: Omit<PreventiveAction, "id" | "capaId"> & { id?: string }) => PreventiveAction;
  updatePAStatus: (actionId: string, status: PreventiveAction["status"]) => void;
  removePA: (actionId: string) => void;
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

interface IntakeSubmission {
  findingId: string;
  type: CAPAType;
  title: string;
  severity: Severity;
  gateAnswers: GateAnswer[];
  impact?: ImpactClassification;
}

// Andi's intake submission needs sign-off from BOTH the QA reviewer (Siti)
// and the Department Head (Bambang) before the 8D investigation can begin.
const INTAKE_REVIEWERS: Array<Pick<IntakeReview, "reviewerPersonaId" | "reviewerName" | "role">> = [
  {
    reviewerPersonaId: "qa_deviation",
    reviewerName: "Siti Rahmawati",
    role: "QA Deviation / QA Compliance / QA Complaint",
  },
  {
    reviewerPersonaId: "head_of_dept",
    reviewerName: "Bambang Saputra",
    role: "Department Head",
  },
];

const INTAKE_DECISION_LABEL: Record<IntakeDecision, string> = {
  accepted: "Continue to CAPA",
  revision_requested: "Send for Re-work",
  rejected: "Reject",
};

// The static per-type prefill templates carry sample IDs/locations. A freshly
// intaken finding only has the fields on the Finding record, so derive the
// preFill from the finding itself — identity, date, department, severity, and
// the observation all reflect the real finding. Fields the Finding doesn't
// carry (line/equipment, initiator, auditor, customer, etc.) are left blank
// rather than inheriting an unrelated sample.
function buildPreFillFromFinding(finding: Finding, type: CAPAType): PreFillContext {
  if (type === "audit") {
    return {
      source: "Q100+",
      findingId: finding.id,
      auditId: "",
      auditType: "internal",
      reportedAt: finding.reportedAt,
      auditDate: finding.reportedAt,
      auditor: { name: "", organization: "" },
      auditee: { department: finding.department, contactPerson: "" },
      findingCategory: "",
      findingDescription: finding.shortDescription,
      regulationReference: [],
      severity: finding.severity,
      sopReferences: [],
    };
  }

  if (type === "complaint") {
    return {
      source: "Bizzmine-Complaint",
      complaintId: finding.id,
      reportedAt: finding.reportedAt,
      customer: { name: "", type: "distributor" },
      product: { name: "", lotNumber: "", expiryDate: "" },
      complaintType: "",
      description: finding.shortDescription,
      initialSeverity: finding.severity,
      attachments: [],
    };
  }

  return {
    source: "Bizzmine",
    deviationId: finding.id,
    reportedAt: finding.reportedAt,
    occurredAt: finding.reportedAt,
    location: { department: finding.department, area: "", line: "", equipmentId: "" },
    initiator: { name: "", role: "", nik: "" },
    initialObservation: finding.shortDescription,
    affectedBatches: [],
    attachments: [],
    sopReferences: [],
    initialSeverity: finding.severity,
  };
}

function createInitialCAPA(finding: Finding, type: CAPAType): CAPACase {
  const now = new Date().toISOString();
  const id = `CAPA-${finding.id.replace(/^(DEV|AUD|CMP)-/, "")}`;

  return {
    id,
    findingId: finding.id,
    type,
    title: finding.shortDescription,
    preFill: buildPreFillFromFinding(finding, type),
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
      submitIntake: (payload) => {
        const { findingId, type, title, severity, gateAnswers, impact } = payload;
        const finding = get().findings.find((record) => record.id === findingId);
        if (!finding) return undefined;

        const existing = get().capas.find((capa) => capa.findingId === findingId);

        // Once a CAPA has cleared intake review, re-submitting from the wizard
        // must NOT spawn a duplicate or reset progress — just hand back the
        // live case so the caller can route the user to it.
        if (existing && ["investigation", "approval", "closed"].includes(existing.status)) {
          return existing;
        }

        const now = new Date().toISOString();
        const base = existing ?? createInitialCAPA(finding, type);
        const reviews: IntakeReview[] = INTAKE_REVIEWERS.map((reviewer) => ({ ...reviewer }));

        const updated: CAPACase = {
          ...base,
          type,
          title: title.trim() || base.title,
          gateAnswers,
          impact: { ...(impact ?? base.impact), severity },
          intakeReviews: reviews,
          status: "pending_review",
          currentStep: "problem",
          createdBy: "initiator",
          assignedTo: "qa_deviation",
          updatedAt: now,
        };

        set((state) => ({
          capas: existing
            ? state.capas.map((capa) => (capa.id === base.id ? updated : capa))
            : [updated, ...state.capas],
          findings: state.findings.map((record) =>
            record.id === findingId
              ? { ...record, linkedCapaId: updated.id, status: "pending_review" }
              : record,
          ),
        }));

        useAuditTrailStore.getState().addEvent({
          actorPersonaId: "initiator",
          actorName: "Andi Wijaya",
          actorRole: "Initiator",
          domain: "system",
          eventType: "source_imported",
          action: `${updated.id} submitted for intake review (Siti Rahmawati, Bambang Saputra).`,
          capaId: updated.id,
          findingId,
        });

        INTAKE_REVIEWERS.forEach((reviewer) => {
          useNotificationStore.getState().addNotification({
            recipientPersonaId: reviewer.reviewerPersonaId,
            type: "capa_update",
            title: "Intake review needed",
            description: `${updated.id} was submitted by Andi Wijaya and needs your intake decision.`,
            capaId: updated.id,
            actionUrl: `/capa/${updated.id}`,
          });
        });

        return updated;
      },
      recordIntakeDecision: (capaId, reviewerPersonaId, decision, notes) => {
        const capa = get().capas.find((record) => record.id === capaId);
        if (!capa || !capa.intakeReviews) return;

        const now = new Date().toISOString();
        const trimmedNotes = notes?.trim() ? notes.trim() : undefined;
        const reviewer = INTAKE_REVIEWERS.find((r) => r.reviewerPersonaId === reviewerPersonaId);

        const reviews = capa.intakeReviews.map((review) =>
          review.reviewerPersonaId === reviewerPersonaId
            ? { ...review, decision, notes: trimmedNotes, reviewedAt: now }
            : review,
        );

        // Aggregate outcome: any rejection ends the case; any re-work request
        // bounces it back to Andi; only when BOTH reviewers accept does the
        // 8D investigation unlock.
        let status: CAPAStatus;
        if (reviews.some((r) => r.decision === "rejected")) {
          status = "rejected";
        } else if (reviews.some((r) => r.decision === "revision_requested")) {
          status = "revision_requested";
        } else if (reviews.every((r) => r.decision === "accepted")) {
          status = "investigation";
        } else {
          status = "pending_review";
        }

        const findingStatus: Finding["status"] =
          status === "investigation"
            ? "capa_in_progress"
            : status === "rejected"
              ? "pending_capa"
              : "pending_review";

        set((state) => ({
          capas: state.capas.map((record) =>
            record.id === capaId
              ? { ...record, intakeReviews: reviews, status, updatedAt: now }
              : record,
          ),
          findings: state.findings.map((record) =>
            record.id === capa.findingId ? { ...record, status: findingStatus } : record,
          ),
        }));

        useAuditTrailStore.getState().addEvent({
          actorPersonaId: reviewerPersonaId,
          actorName: reviewer?.reviewerName ?? reviewerPersonaId,
          actorRole: reviewer?.role ?? "Reviewer",
          domain: "system",
          eventType: "source_imported",
          action: `Intake decision "${INTAKE_DECISION_LABEL[decision]}" recorded for ${capaId}.`,
          capaId,
          findingId: capa.findingId,
          after: trimmedNotes,
        });

        const initiatorMessage: Record<CAPAStatus, string> = {
          investigation: `${capaId} cleared intake review — you can now start the 8D investigation.`,
          revision_requested: `${capaId} was sent back for re-work. Review the reviewer notes and resubmit.`,
          rejected: `${capaId} was rejected at intake review.`,
          pending_review: `${reviewer?.reviewerName ?? "A reviewer"} recorded a decision on ${capaId}. Awaiting the second reviewer.`,
          draft: "",
          approval: "",
          closed: "",
        };

        useNotificationStore.getState().addNotification({
          recipientPersonaId: "initiator",
          type: "capa_update",
          title:
            status === "investigation"
              ? "Intake approved"
              : status === "rejected"
                ? "Intake rejected"
                : status === "revision_requested"
                  ? "Re-work requested"
                  : "Intake review update",
          description: initiatorMessage[status],
          capaId,
          actionUrl: `/capa/${capaId}`,
        });
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
      removeCA: (actionId) => {
        set((state) => ({
          correctiveActions: state.correctiveActions.filter((action) => action.id !== actionId),
        }));
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
      updatePAStatus: (actionId, status) => {
        const completedAt =
          status === "completed" || status === "verified" ? new Date().toISOString() : undefined;

        set((state) => ({
          preventiveActions: state.preventiveActions.map((action) =>
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
          eventType: "preventive_action_added",
          action: `Preventive action ${actionId} status updated to ${status}.`,
        });
      },
      removePA: (actionId) => {
        set((state) => ({
          preventiveActions: state.preventiveActions.filter((action) => action.id !== actionId),
        }));
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
