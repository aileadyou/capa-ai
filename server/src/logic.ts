import * as repo from "./repo.js";
import { genId } from "./repo.js";
import { getCycleByStage, getFinalStage, resolveCycleApprovers } from "./workflows.js";

// ─────────────────────────────────────────────────────────────────────────────
// Ported CAPA workflow logic — a faithful server-side copy of the actions that
// used to live in src/store/useCapaStore.ts. Side effects (audit events +
// notifications) are written straight to the DB. Permission checks that used to
// read the active persona from a client store now take an `actor` argument.
// ─────────────────────────────────────────────────────────────────────────────

type CAPAType = "deviation" | "audit" | "complaint";

const INTAKE_REVIEWERS = [
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
] as const;

const INTAKE_DECISION_LABEL: Record<string, string> = {
  accepted: "Continue to CAPA",
  revision_requested: "Send for Re-work",
  rejected: "Reject",
};

const now = () => new Date().toISOString();

// Fallback prefill derived purely from the Finding when no source record exists.
function buildPreFillFromFinding(finding: any, type: CAPAType): any {
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

function createInitialCAPA(finding: any, type: CAPAType): any {
  const ts = now();
  const id = `CAPA-${finding.id.replace(/^(DEV|AUD|CMP)-/, "")}`;

  // Source-of-truth prefill: the imported source record, selected by findingId.
  const sourceRecord = repo.getSourceRecordByFinding(finding.id);
  const preFill =
    sourceRecord && sourceRecord.type === type
      ? sourceRecord.prefill
      : buildPreFillFromFinding(finding, type);

  return {
    id,
    findingId: finding.id,
    type,
    title: finding.shortDescription,
    preFill,
    gateAnswers: [],
    score: { problemSpecificity: 0, rootCauseDepth: 0, effectiveness: 0, containment: 0, total: 0, isAuditReady: false },
    impact: {
      severity: "Major",
      totalWeight: 0,
      factors: [],
      rationale: "Nova will classify this finding during intake.",
      computedAt: ts,
    },
    rca: {
      method: type === "audit" ? "fishbone" : type === "complaint" ? "decision_tree" : "5whys",
      confirmedRootCauses: [],
    },
    correctiveActions: [],
    preventiveActions: [],
    verification: { evidenceFileNames: [] },
    approvals: [],
    auditEvents: [],
    suggestions: [],
    status: "draft",
    currentStep: "problem",
    createdAt: ts,
    updatedAt: ts,
    createdBy: type === "deviation" ? "initiator" : "qa_deviation",
    assignedTo: "qa_deviation",
    department: finding.department,
    ...(type === "audit"
      ? {
          auditPhase: "plan",
          auditContext: {
            variant: "internal",
            schedule: {
              dateRange: { start: finding.reportedAt, end: finding.reportedAt },
              auditTeam: [],
              scope: finding.shortDescription,
              auditee: finding.department,
            },
          },
        }
      : {}),
  };
}

// ── Intake ───────────────────────────────────────────────────────────────────

export function createCAPAFromFinding(findingId: string, type: CAPAType): any {
  const existing = repo.getCapaByFinding(findingId);
  if (existing) return existing;

  const finding = repo.getFinding(findingId);
  if (!finding) return undefined;

  const newCAPA = createInitialCAPA(finding, type);
  repo.upsertCapa(newCAPA);
  repo.upsertFinding({ ...finding, linkedCapaId: newCAPA.id, status: "capa_in_progress" });

  repo.addAuditEvent({
    actorName: "Nova",
    actorRole: "AI Coach",
    domain: "system",
    eventType: "source_imported",
    action: `Created ${newCAPA.id} from finding ${findingId}.`,
    capaId: newCAPA.id,
    findingId,
  });
  repo.addNotification({
    recipientPersonaId: "qa_deviation",
    type: "capa_update",
    title: "CAPA created from finding",
    description: `${newCAPA.id} was created and is ready for QA review.`,
    capaId: newCAPA.id,
    actionUrl: `/capa/${newCAPA.id}`,
  });

  return repo.getCapa(newCAPA.id);
}

export function submitIntake(payload: {
  findingId: string;
  type: CAPAType;
  title: string;
  severity: string;
  gateAnswers: any[];
  impact?: any;
}): any {
  const { findingId, type, title, severity, gateAnswers, impact } = payload;
  const finding = repo.getFinding(findingId);
  if (!finding) return undefined;

  const existing = repo.getCapaByFinding(findingId);

  if (existing && ["investigation", "approval", "closed"].includes(existing.status)) return existing;
  if (existing && (existing.status === "pending_review" || existing.status === "rejected")) return existing;

  const ts = now();
  const base = existing ?? createInitialCAPA(finding, type);
  const reviews = INTAKE_REVIEWERS.map((reviewer) => ({ ...reviewer }));

  const updated = {
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
    updatedAt: ts,
  };

  repo.upsertCapa(updated);
  repo.upsertFinding({ ...finding, linkedCapaId: updated.id, status: "pending_review" });

  repo.addAuditEvent({
    actorPersonaId: "initiator",
    actorName: "Andi Wijaya",
    actorRole: "Initiator",
    domain: "system",
    eventType: "source_imported",
    action: `${updated.id} submitted for intake review (Siti Rahmawati, Bambang Saputra).`,
    capaId: updated.id,
    findingId,
  });
  for (const reviewer of INTAKE_REVIEWERS) {
    repo.addNotification({
      recipientPersonaId: reviewer.reviewerPersonaId,
      type: "capa_update",
      title: "Intake review needed",
      description: `${updated.id} was submitted by Andi Wijaya and needs your intake decision.`,
      capaId: updated.id,
      actionUrl: `/capa/${updated.id}`,
    });
  }

  return repo.getCapa(updated.id);
}

export function recordIntakeDecision(
  capaId: string,
  reviewerPersonaId: string,
  decision: string,
  notes: string | undefined,
  actor: string,
): { ok: boolean; capa?: any } {
  const capa = repo.getCapa(capaId);
  if (!capa || !capa.intakeReviews) return { ok: false };
  if (actor !== reviewerPersonaId) return { ok: false };

  const ts = now();
  const trimmedNotes = notes?.trim() ? notes.trim() : undefined;
  const reviewer = INTAKE_REVIEWERS.find((r) => r.reviewerPersonaId === reviewerPersonaId);
  const currentReview = capa.intakeReviews.find((r: any) => r.reviewerPersonaId === reviewerPersonaId);
  if (!reviewer || !currentReview || currentReview.decision || capa.status !== "pending_review") return { ok: false };

  const reviews = capa.intakeReviews.map((review: any) =>
    review.reviewerPersonaId === reviewerPersonaId
      ? { ...review, decision, notes: trimmedNotes, reviewedAt: ts }
      : review,
  );

  let status: string;
  if (reviews.some((r: any) => r.decision === "rejected")) status = "rejected";
  else if (reviews.some((r: any) => r.decision === "revision_requested")) status = "revision_requested";
  else if (reviews.every((r: any) => r.decision === "accepted")) status = "investigation";
  else status = "pending_review";

  const findingStatus =
    status === "investigation" ? "capa_in_progress" : status === "rejected" ? "rejected" : "pending_review";

  const disposisi =
    capa.type === "deviation" && reviewerPersonaId === "qa_deviation" && decision === "accepted"
      ? {
          reviewerPersonaId: "qa_deviation",
          assignedTo: capa.assignedTo,
          severity: capa.impact.severity,
          rationale: trimmedNotes ?? "Classified by QA for full CAPA investigation.",
          dispositionAt: ts,
        }
      : undefined;

  repo.upsertCapa({ ...capa, intakeReviews: reviews, status, updatedAt: ts, ...(disposisi ? { disposisi } : {}) });

  const finding = repo.getFinding(capa.findingId);
  if (finding) {
    repo.upsertFinding({
      ...finding,
      status: findingStatus,
      ...(status === "rejected" ? { linkedCapaId: undefined } : {}),
    });
  }

  repo.addAuditEvent({
    actorPersonaId: reviewerPersonaId,
    actorName: reviewer.reviewerName,
    actorRole: reviewer.role,
    domain: "system",
    eventType: "source_imported",
    action: `Intake decision "${INTAKE_DECISION_LABEL[decision]}" recorded for ${capaId}.`,
    capaId,
    findingId: capa.findingId,
    after: trimmedNotes,
  });

  const initiatorMessage: Record<string, string> = {
    investigation: `${capaId} cleared intake review — you can now start the 8D investigation.`,
    revision_requested: `${capaId} was sent back for re-work. Review the reviewer notes and resubmit.`,
    rejected: `${capaId} was rejected at intake review.`,
    pending_review: `${reviewer.reviewerName} recorded a decision on ${capaId}. Awaiting the second reviewer.`,
  };
  repo.addNotification({
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
    actionUrl: status === "rejected" ? `/findings/${capa.findingId}` : `/capa/${capaId}`,
  });

  return { ok: true, capa: repo.getCapa(capaId) };
}

// ── 8D step updates ──────────────────────────────────────────────────────────

export function updateProblemStatement(capaId: string, statement: string, score: any): any {
  const capa = repo.getCapa(capaId);
  if (!capa) return undefined;
  const gateAnswers = [
    ...capa.gateAnswers.filter((a: any) => a.questionId !== "observation"),
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
  ];
  return repo.upsertCapa({ ...capa, gateAnswers, score, updatedAt: now() });
}

export function updateContainmentAction(
  capaId: string,
  action: { description: string; pic: string; dueDate: string },
  score: any,
): any {
  const capa = repo.getCapa(capaId);
  if (!capa) return undefined;
  const gateAnswers = [
    ...capa.gateAnswers.filter((a: any) => a.questionId !== "containment"),
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
  ];
  return repo.upsertCapa({ ...capa, gateAnswers, score, updatedAt: now() });
}

export function updateRCA(capaId: string, rca: any, score: any): any {
  const capa = repo.getCapa(capaId);
  if (!capa) return undefined;
  return repo.upsertCapa({ ...capa, rca, score, updatedAt: now() });
}

export function updateCurrentStep(capaId: string, step: string): any {
  const capa = repo.getCapa(capaId);
  if (!capa) return undefined;
  return repo.upsertCapa({
    ...capa,
    currentStep: step,
    status: step === "signoff" ? "approval" : "investigation",
    updatedAt: now(),
  });
}

export function updateScore(capaId: string, score: any): any {
  const capa = repo.getCapa(capaId);
  if (!capa) return undefined;
  return repo.upsertCapa({ ...capa, score, updatedAt: now() });
}

// ── Corrective / preventive actions ──────────────────────────────────────────

export function addCA(capaId: string, action: any): any {
  const newAction = {
    ...action,
    id: action.id ?? genId(`CA-${capaId.replace("CAPA-", "")}`),
    capaId,
  };
  repo.upsertCorrectiveAction(newAction);
  repo.addAuditEvent({
    actorName: "Nova Demo User",
    actorRole: "CAPA User",
    domain: "system",
    eventType: "corrective_action_added",
    action: `Corrective action ${newAction.id} was added to ${capaId}.`,
    capaId,
  });
  return newAction;
}

export function updateCAStatus(actionId: string, status: string): any {
  const action = repo.getCorrectiveAction(actionId);
  if (!action) return undefined;
  const completedAt = status === "completed" || status === "verified" ? now() : undefined;
  const updated = repo.upsertCorrectiveAction({ ...action, status, completedAt });
  repo.addAuditEvent({
    actorName: "Nova Demo User",
    actorRole: "CAPA User",
    domain: "system",
    eventType: "corrective_action_added",
    action: `Corrective action ${actionId} status updated to ${status}.`,
  });
  return updated;
}

export function removeCA(actionId: string): void {
  repo.deleteCorrectiveAction(actionId);
}

export function addPA(capaId: string, action: any): any {
  const newAction = {
    ...action,
    id: action.id ?? genId(`PA-${capaId.replace("CAPA-", "")}`),
    capaId,
  };
  repo.upsertPreventiveAction(newAction);
  repo.addAuditEvent({
    actorName: "Nova Demo User",
    actorRole: "CAPA User",
    domain: "system",
    eventType: "preventive_action_added",
    action: `Preventive action ${newAction.id} was added to ${capaId}.`,
    capaId,
  });
  return newAction;
}

export function updatePAStatus(actionId: string, status: string): any {
  const action = repo.getPreventiveAction(actionId);
  if (!action) return undefined;
  const completedAt = status === "completed" || status === "verified" ? now() : undefined;
  const updated = repo.upsertPreventiveAction({ ...action, status, completedAt });
  repo.addAuditEvent({
    actorName: "Nova Demo User",
    actorRole: "CAPA User",
    domain: "system",
    eventType: "preventive_action_added",
    action: `Preventive action ${actionId} status updated to ${status}.`,
  });
  return updated;
}

export function removePA(actionId: string): void {
  repo.deletePreventiveAction(actionId);
}

export function completeVerification(capaId: string, verification: any): any {
  const capa = repo.getCapa(capaId);
  if (!capa) return undefined;
  const updated = repo.upsertCapa({
    ...capa,
    verification: { ...verification, verifiedAt: verification.verifiedAt ?? now() },
    updatedAt: now(),
  });
  repo.addAuditEvent({
    actorName: "Nova Demo User",
    actorRole: "CAPA User",
    domain: "system",
    eventType: "verification_completed",
    action: `Verification was completed for ${capaId}.`,
    capaId,
  });
  return updated;
}

// ── Approvals ────────────────────────────────────────────────────────────────

export function recordApproval(
  capaId: string,
  stage: string,
  approval: any,
  actor: string,
): { ok: boolean; capa?: any; notFound?: boolean; reason?: string } {
  const ts = now();
  const capa = repo.getCapa(capaId);
  if (!capa) return { ok: false, notFound: true };

  const cycle = getCycleByStage(capa, stage as any);
  if (!cycle) return { ok: false, reason: `No approval cycle found for stage "${stage}".` };

  const required = resolveCycleApprovers(cycle, capa);
  const stageApprovalsBefore = capa.approvals.filter(
    (event: any) => (event.stage ?? getFinalStage(capa)) === stage,
  );
  const approvedIdsBefore = new Set(
    stageApprovalsBefore.filter((e: any) => e.decision === "approved").map((e: any) => e.approverPersonaId),
  );
  const alreadyActed = stageApprovalsBefore.some((e: any) => e.approverPersonaId === approval.approverPersonaId);

  if (capa.status === "closed" || capa.status === "revision_requested")
    return { ok: false, reason: `CAPA is ${capa.status} and cannot accept further approvals.` };
  if (!required.includes(approval.approverPersonaId))
    return { ok: false, reason: `${approval.approverPersonaId} is not a required approver for the ${stage} cycle.` };
  if (actor !== approval.approverPersonaId)
    return { ok: false, reason: "The active persona does not match the approver. Switch personas and try again." };
  if (alreadyActed)
    return { ok: false, reason: `${approval.approverName ?? approval.approverPersonaId} has already submitted a decision for this cycle.` };

  const stamped = { ...approval, stage, signedAt: approval.signedAt ?? ts };

  // Upsert keyed by persona + stage.
  let working = {
    ...capa,
    approvals: [
      ...capa.approvals.filter(
        (e: any) => !(e.approverPersonaId === approval.approverPersonaId && (e.stage ?? getFinalStage(capa)) === stage),
      ),
      stamped,
    ],
    updatedAt: ts,
  };
  repo.upsertCapa(working);

  repo.addAuditEvent({
    actorPersonaId: approval.approverPersonaId,
    actorName: approval.approverName,
    actorRole: approval.role,
    domain: "system",
    eventType: "esignature_submitted",
    action: `${approval.approverName} ${approval.decision} the ${stage} cycle of ${capaId} with electronic signature.`,
    capaId,
  });

  // Rejection bounces the cycle back for revision.
  if (approval.decision === "rejected") {
    repo.upsertCapa({ ...working, status: "revision_requested", updatedAt: ts });
    // Notify the QA assignee (was already here).
    if (capa.assignedTo !== "initiator") {
      repo.addNotification({
        recipientPersonaId: capa.assignedTo,
        type: "capa_update",
        title: "Approval rejected",
        description: `${approval.approverName} rejected the ${stage} approval for ${capaId}. Revision requested.`,
        capaId,
        actionUrl: `/capa/${capaId}`,
      });
    }
    // Also notify Andi (initiator) so he knows the workflow is blocked.
    repo.addNotification({
      recipientPersonaId: "initiator",
      type: "capa_update",
      title: "Approval rejected — revision needed",
      description: `${approval.approverName} rejected the ${stage} review for ${capaId}. Address the notes and resubmit.`,
      capaId,
      actionUrl: `/capa/${capaId}`,
    });
    return { ok: true, capa: repo.getCapa(capaId) };
  }

  // Has every required approver in this cycle now signed off?
  const updated = repo.getCapa(capaId);
  const stageApprovals = updated.approvals.filter(
    (e: any) => (e.stage ?? getFinalStage(updated)) === stage,
  );
  const cycleComplete = required.every((personaId) =>
    stageApprovals.some((e: any) => e.approverPersonaId === personaId && e.decision === "approved"),
  );
  if (!cycleComplete) return { ok: true, capa: updated };

  if (cycle.final) {
    if (updated.score.total < 80) return { ok: true, capa: updated };
    closeCAPA(capaId);
    return { ok: true, capa: repo.getCapa(capaId) };
  }

  // Non-final cycle fully approved — notify initiator so they know they can
  // continue to the next 8D step without waiting on anyone.
  const cycleNextStep: Record<string, { label: string; url: string }> = {
    plan:     { label: "Your CAPA Plan was approved by all reviewers. Continue to D6 Verification.", url: `/capa/${capaId}/8d/verification` },
    actual:   { label: "Your CAPA Actual implementation was approved. Proceed to D7 Sign-off.",      url: `/capa/${capaId}/8d/signoff`      },
    analysis: { label: "Round 1 Analysis was approved by all reviewers. Continue to D6 Verification.", url: `/capa/${capaId}/8d/verification` },
  };
  const next = cycleNextStep[stage] ?? { label: `The ${stage} approval cycle was approved. Continue to the next step.`, url: `/capa/${capaId}` };
  repo.addNotification({
    recipientPersonaId: "initiator",
    type: "approval",
    title: "Approval cycle complete ✓",
    description: next.label,
    capaId,
    actionUrl: next.url,
  });

  if (stage === "plan") {
    repo.upsertCapa({ ...updated, auditPhase: "actual", updatedAt: ts });
  }
  return { ok: true, capa: repo.getCapa(capaId) };
}

export function approveSignOff(capaId: string, approval: any, actor: string): { ok: boolean; capa?: any; notFound?: boolean; reason?: string } {
  const capa = repo.getCapa(capaId);
  if (!capa) return { ok: false, notFound: true };
  return recordApproval(capaId, getFinalStage(capa), approval, actor);
}

export function closeCAPA(capaId: string): any {
  const capa = repo.getCapa(capaId);
  if (!capa) return undefined;

  const updated = repo.upsertCapa({
    ...capa,
    status: "closed",
    currentStep: "signoff",
    score: { ...capa.score, total: Math.max(capa.score.total, 80), isAuditReady: true },
    updatedAt: now(),
  });

  const finding = repo.getFinding(capa.findingId);
  if (finding) repo.upsertFinding({ ...finding, status: "capa_closed" });

  repo.addAuditEvent({
    actorName: "System",
    actorRole: "Demo Runtime",
    domain: "system",
    eventType: "capa_closed",
    action: `${capaId} was marked as Audit Ready and Closed.`,
    capaId,
    findingId: capa.findingId,
  });

  // Notify the initiator that their CAPA has been fully approved and closed.
  repo.addNotification({
    recipientPersonaId: "initiator",
    type: "approval",
    title: "CAPA closed — Audit Ready ✓",
    description: `All approvals for ${capaId} are complete. The CAPA is now closed and marked as Audit Ready.`,
    capaId,
    actionUrl: `/capa/${capaId}`,
  });

  return updated;
}
