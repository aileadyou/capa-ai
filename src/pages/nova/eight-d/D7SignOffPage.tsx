import { useMemo, useState } from "react";
import { useDialog } from "@/hooks/use-dialog";
import { useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Circle, PenLine, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { EightDShell } from "@/components/layout/EightDShell";
import { ScorePill } from "@/components/shared/ScorePill";
import NotFound from "@/pages/NotFound";
import { useAuditTrailStore, useCapaStore, useNotificationStore } from "@/store";
import type { ApprovalEvent, CAPACase, CorrectiveAction, PreventiveAction } from "@/types";
// CorrectiveAction & PreventiveAction used in ActionRow props
import type { PersonaID } from "@/types/persona";
import { formatCAPAType, formatDate, formatDateTime } from "@/utils/formatters";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface Approver {
  personaId: PersonaID;
  name: string;
  role: string;
}

const approvers: Record<PersonaID, Omit<Approver, "personaId">> = {
  initiator: { name: "Andi Wijaya", role: "Initiator" },
  qa_deviation: { name: "Siti Rahmawati", role: "QA Deviation / QA Compliance / QA Complaint" },
  head_of_dept: { name: "Bambang Saputra", role: "Department Head" },
  head_of_qa: { name: "Dewi Anggraini", role: "Head of QA" },
  sme: { name: "Dr. Ahmad Pratomo", role: "SME Microbiology" },
};

function getApprovalChain(capa: CAPACase): Approver[] {
  const chain: PersonaID[] =
    capa.type === "complaint"
      ? ["qa_deviation", "head_of_dept", "head_of_qa"]
      : ["head_of_dept", "qa_deviation", "head_of_qa"];

  if (capa.impact.severity === "Major" || capa.impact.severity === "Critical") {
    chain.splice(chain.length - 1, 0, "sme");
  }

  return chain.map((personaId) => ({ personaId, ...approvers[personaId] }));
}

function getApprovalFor(approvals: ApprovalEvent[], personaId: PersonaID) {
  return approvals.find((a) => a.approverPersonaId === personaId);
}

// ── E-Signature Modal ────────────────────────────────────────────────────────

function ESignatureModal({
  approver,
  onApprove,
  onReject,
  onClose,
}: {
  approver: Approver;
  onApprove: (notes: string) => void;
  onReject: (notes: string) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");
  const { ref } = useDialog<HTMLDivElement>(true, onClose);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--glass-dark)] backdrop-blur"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="esig-title"
        tabIndex={-1}
        className="flex max-h-[calc(100vh-48px)] w-full max-w-[440px] animate-[leadReveal_var(--dur-tab)_var(--ease-out)] flex-col gap-4 overflow-y-auto overscroll-contain rounded-[var(--r-xl)] border border-[var(--line-2)] bg-card p-6 shadow-lg"
      >
        {/* Header */}
        <div>
          <p className="mb-1.5 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            E-Signature
          </p>
          <h2 id="esig-title" className="mb-1 mt-0 font-sans text-lg font-bold text-foreground">
            Approval Decision
          </h2>
          <p className="m-0 text-[13px] text-foreground-tertiary">
            {approver.name} will sign this CAPA with a mocked electronic signature and timestamp.
          </p>
        </div>

        {/* Approver info */}
        <div className="rounded-[var(--r-md)] border border-border-subtle bg-elevated px-3.5 py-3">
          <p className="mb-0.5 mt-0 font-sans text-[13px] font-semibold text-foreground">
            {approver.name}
          </p>
          <p className="mb-1.5 mt-0 font-sans text-xs text-foreground-tertiary">
            {approver.role}
          </p>
          <p className="m-0 font-sans text-[11px] text-foreground-faint">
            {new Date().toLocaleString()}
          </p>
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="esig-notes"
            className="mb-2 block font-sans text-xs font-semibold tracking-[0.02em] text-foreground-secondary"
          >
            Notes (optional)
          </label>
          <textarea
            id="esig-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Approval or rejection notes…"
            className="box-border w-full resize-y rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-3 py-2.5 font-sans text-[13px] leading-[1.6] text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2.5 pt-1">
          <button
            onClick={() => onReject(notes)}
            className="cursor-pointer rounded-[var(--r-sm)] border border-destructive/40 bg-[var(--danger-soft)] px-4 py-2 font-sans text-[13px] font-semibold text-destructive"
          >
            Reject
          </button>
          <button
            onClick={() => onApprove(notes)}
            className="cursor-pointer rounded-[var(--r-sm)] border-0 bg-[image:var(--grad-brand)] px-5 py-2 font-sans text-[13px] font-semibold text-primary-foreground"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Comprehensive Review ──────────────────────────────────────────────────────

const GATE_QUESTION_LABELS: Record<string, string> = {
  observation: "What was observed?",
  scope: "What is the scope?",
  impact: "What is the patient/product/process impact?",
  containment: "What containment measures were taken?",
  cause_confirmation: "Has the root cause been confirmed?",
  effectiveness_criteria: "What are the effectiveness criteria?",
};

function ReviewBlock({
  title,
  tag,
  isLast = false,
  children,
}: {
  title: string;
  tag: string;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("px-4 py-4", !isLast && "border-b border-border-subtle")}>
      <div className="mb-3 flex items-center gap-3">
        <span className="rounded-[var(--r-sm)] border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-sans text-[10px] font-bold text-primary">
          {tag}
        </span>
        <span className="font-sans text-[13px] font-semibold text-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

function ActionRow({ action }: { action: CorrectiveAction | PreventiveAction }) {
  const statusColors: Record<string, string> = {
    open: "text-foreground-tertiary",
    in_progress: "text-primary",
    completed: "text-success",
    overdue: "text-destructive",
    verified: "text-success",
  };
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border-subtle py-2.5 last:border-0 last:pb-0">
      <p className="m-0 flex-1 text-[13px] leading-[1.55] text-foreground-secondary">
        {action.description}
      </p>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className={cn("font-sans text-[11px] font-semibold", statusColors[action.status] ?? "text-foreground-tertiary")}>
          {action.status.replace("_", " ")}
        </span>
        <span className="font-sans text-[10px] text-foreground-faint">{action.pic}</span>
      </div>
    </div>
  );
}

function ComprehensiveReview({ capa }: { capa: CAPACase }) {
  const gateAnswers = capa.gateAnswers ?? [];
  const cas = capa.correctiveActions;
  const pas = capa.preventiveActions;
  const rca = capa.rca;
  const verification = capa.verification;

  return (
    <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-border-subtle bg-elevated px-4 py-3.5">
        <ShieldCheck size={14} className="shrink-0 text-primary" />
        <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">
          Case Summary (D1–D6)
        </p>
        <span className="ml-auto font-sans text-[11px] text-foreground-faint">
          Review before signing
        </span>
      </div>

      <div className="flex flex-col gap-0">
        {/* D1 — Problem statement */}
        <ReviewBlock tag="D1" title="Problem Statement">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-[var(--r-full)] border border-border-subtle bg-elevated px-2.5 py-0.5 font-sans text-xs text-foreground-secondary">
              {formatCAPAType(capa.type)}
            </span>
            <span className="rounded-[var(--r-full)] border border-border-subtle bg-elevated px-2.5 py-0.5 font-sans text-xs text-foreground-secondary">
              {capa.impact.severity}
            </span>
          </div>
          <p className="mb-3 mt-0 font-sans text-[13px] font-semibold text-foreground">{capa.title}</p>
          {gateAnswers.length > 0 ? (
            <div className="flex flex-col gap-3">
              {gateAnswers.map((a) => (
                <div key={a.questionId}>
                  <p className="mb-1 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-tertiary">
                    {GATE_QUESTION_LABELS[a.questionId] ?? a.questionId}
                  </p>
                  <p className="m-0 text-[13px] leading-[1.6] text-foreground-secondary">{a.answer}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="m-0 text-[13px] text-foreground-faint italic">No gate answers recorded.</p>
          )}
        </ReviewBlock>

        {/* D2 — Containment */}
        <ReviewBlock tag="D2" title="Containment">
          {(() => {
            const containmentGate = gateAnswers.find((a) => a.questionId === "containment");
            return containmentGate ? (
              <p className="m-0 text-[13px] leading-[1.6] text-foreground-secondary">{containmentGate.answer}</p>
            ) : (
              <p className="m-0 text-[13px] text-foreground-faint italic">No containment answer recorded.</p>
            );
          })()}
          {capa.impact.rationale && (
            <p className="mb-0 mt-3 text-[12px] leading-[1.5] text-foreground-tertiary">
              <span className="font-semibold">Impact rationale:</span> {capa.impact.rationale}
            </p>
          )}
        </ReviewBlock>

        {/* D3 — Root cause */}
        <ReviewBlock tag="D3" title="Root Cause Analysis">
          <p className="mb-2 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-tertiary">
            Method: {rca.method?.replace("_", " ") ?? "—"}
          </p>
          {rca.confirmedRootCauses.length > 0 ? (
            <ul className="m-0 flex flex-col gap-1.5 pl-4">
              {rca.confirmedRootCauses.map((rc, i) => (
                <li key={i} className="text-[13px] leading-[1.55] text-foreground-secondary">{rc}</li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-[13px] text-foreground-faint italic">No confirmed root causes recorded.</p>
          )}
        </ReviewBlock>

        {/* D4 — Corrective actions */}
        <ReviewBlock tag="D4" title={`Corrective Actions (${cas.length})`}>
          {cas.length > 0 ? (
            <div>{cas.map((a) => <ActionRow key={a.id} action={a} />)}</div>
          ) : (
            <p className="m-0 text-[13px] text-foreground-faint italic">No corrective actions added.</p>
          )}
        </ReviewBlock>

        {/* D5 — Preventive actions */}
        <ReviewBlock tag="D5" title={`Preventive Actions (${pas.length})`}>
          {pas.length > 0 ? (
            <div>{pas.map((a) => <ActionRow key={a.id} action={a} />)}</div>
          ) : (
            <p className="m-0 text-[13px] text-foreground-faint italic">No preventive actions added.</p>
          )}
        </ReviewBlock>

        {/* D6 — Verification */}
        <ReviewBlock tag="D6" title="Verification" isLast>
          {verification.method ? (
            <div className="flex flex-col gap-2">
              <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-tertiary">
                Method: {verification.method.replace(/_/g, " ")}
              </p>
              {verification.result && (
                <p className="m-0 text-[13px] leading-[1.6] text-foreground-secondary">{verification.result}</p>
              )}
              {verification.verifiedAt && (
                <p className="m-0 text-[11px] text-foreground-faint">
                  Verified {formatDate(verification.verifiedAt)}
                  {verification.verifiedBy ? ` by ${verification.verifiedBy}` : ""}
                </p>
              )}
              {verification.evidenceFileNames.length > 0 && (
                <p className="m-0 text-[12px] text-foreground-tertiary">
                  Evidence: {verification.evidenceFileNames.join(", ")}
                </p>
              )}
            </div>
          ) : (
            <p className="m-0 text-[13px] text-foreground-faint italic">Verification not yet completed.</p>
          )}
        </ReviewBlock>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function D7SignOffPage() {
  const { id } = useParams();
  const rawCapa = useCapaStore((state) => state.capas.find((c) => c.id === id));
  const allCAs = useCapaStore((state) => state.correctiveActions);
  const allPAs = useCapaStore((state) => state.preventiveActions);
  const capa = useMemo(() => {
    if (!rawCapa) return undefined;
    return {
      ...rawCapa,
      correctiveActions: allCAs.filter((a) => a.capaId === rawCapa.id),
      preventiveActions: allPAs.filter((a) => a.capaId === rawCapa.id),
    };
  }, [rawCapa, allCAs, allPAs]);

  const approveSignOff = useCapaStore((state) => state.approveSignOff);
  const closeCAPA = useCapaStore((state) => state.closeCAPA);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const addAuditEvent = useAuditTrailStore((state) => state.addEvent);
  const [selectedApprover, setSelectedApprover] = useState<Approver | undefined>();
  const [hasTriedApproval, setHasTriedApproval] = useState(false);

  const approvalChain = useMemo(() => (capa ? getApprovalChain(capa) : []), [capa]);

  if (!capa) {
    return <NotFound message={`CAPA ${id ?? ""} is not available in the demo dataset.`} />;
  }

  const isAuditReady = capa.score.total >= 80;
  const isClosed = capa.status === "closed";
  const approvedIds = new Set(
    capa.approvals.filter((a) => a.decision === "approved").map((a) => a.approverPersonaId),
  );
  const nextApprover = approvalChain.find((a) => !approvedIds.has(a.personaId));
  const allApproved = approvalChain.every((a) => approvedIds.has(a.personaId));
  const showScoreBlocker = hasTriedApproval && !isAuditReady;

  function openESignature(approver: Approver) {
    setHasTriedApproval(true);

    if (!isAuditReady) {
      toast.error("Sign-off blocked", {
        description: "Quality score must be at least 80 before final approval.",
      });
      return;
    }

    setSelectedApprover(approver);
  }

  function submitDecision(decision: "approved" | "rejected", notes: string) {
    if (!selectedApprover) return;

    const approval: ApprovalEvent = {
      approverPersonaId: selectedApprover.personaId,
      approverName: selectedApprover.name,
      role: selectedApprover.role,
      decision,
      notes: notes.trim() || undefined,
      signedAt: new Date().toISOString(),
    };

    approveSignOff(capa.id, approval);
    addAuditEvent({
      actorPersonaId: selectedApprover.personaId,
      actorName: selectedApprover.name,
      actorRole: selectedApprover.role,
      domain: "system",
      eventType: decision === "approved" ? "capa_approved" : "notification_sent",
      action:
        decision === "approved"
          ? `${selectedApprover.name} approved ${capa.id} in the D7 sign-off chain.`
          : `${selectedApprover.name} rejected ${capa.id} in the D7 sign-off chain.`,
      capaId: capa.id,
      findingId: capa.findingId,
      after: notes.trim() || undefined,
    });

    const nextApprovedIds = new Set(approvedIds);
    if (decision === "approved") nextApprovedIds.add(selectedApprover.personaId);
    const upcomingApprover = approvalChain.find((a) => !nextApprovedIds.has(a.personaId));

    if (decision === "rejected") {
      addNotification({
        recipientPersonaId: "qa_deviation",
        type: "rejected",
        title: "CAPA sign-off rejected",
        description: `${selectedApprover.name} rejected ${capa.id}. Review notes and resubmit.`,
        capaId: capa.id,
        actionUrl: `/capa/${capa.id}`,
      });
      toast.error("CAPA rejected", { description: `${selectedApprover.name} rejected ${capa.id}.` });
    } else if (upcomingApprover) {
      addNotification({
        recipientPersonaId: upcomingApprover.personaId,
        type: "approval",
        title: "CAPA awaiting your approval",
        description: `${capa.id} is ready for ${upcomingApprover.name} to approve.`,
        capaId: capa.id,
        actionUrl: `/capa/${capa.id}`,
      });
      addAuditEvent({
        actorName: "System",
        actorRole: "Demo Runtime",
        domain: "system",
        eventType: "notification_sent",
        action: `Notification sent to ${upcomingApprover.name} for ${capa.id} sign-off.`,
        capaId: capa.id,
        findingId: capa.findingId,
      });
      toast.success("Approval recorded", { description: `Notification sent to ${upcomingApprover.name}.` });
    } else {
      closeCAPA(capa.id);
      approvalChain.forEach((approver) => {
        addNotification({
          recipientPersonaId: approver.personaId,
          type: "closed",
          title: "CAPA closed as Audit Ready",
          description: `${capa.id} has been approved and marked as Audit Ready.`,
          capaId: capa.id,
          actionUrl: `/capa/${capa.id}`,
        });
      });
      toast.success(`${capa.id} closed as Audit Ready`, {
        description: "All approvers signed off. CAPA is now Audit Ready.",
      });
    }

    setSelectedApprover(undefined);
  }

  return (
    <>
      <EightDShell capaId={capa.id} activeStep="signoff">
        <div className="flex flex-col gap-6">

          {/* ── Page header ───────────────────────────────────────────── */}
          <div>
            <p className="mb-1.5 mt-0 font-sans text-xs tracking-[0.18em] text-foreground-tertiary">
              {capa.id} · D7
            </p>
            <div className="mb-2 flex items-center gap-2.5">
              <h1 className="m-0 font-sans text-[22px] font-bold text-foreground">
                Sign-Off
              </h1>
              {isAuditReady && (
                <span className="flex items-center gap-[5px] rounded-[var(--r-full)] border border-success/40 bg-[var(--success-soft)] px-2.5 py-[3px] font-sans text-[11px] font-semibold text-success">
                  <ShieldCheck size={11} />
                  Audit Ready
                </span>
              )}
            </div>
            <p className="m-0 max-w-[600px] text-[13px] leading-[1.55] text-foreground-tertiary">
              Complete the e-signature approval chain for {capa.id}. Final closure requires quality score 80 or higher and all required approvals.
            </p>
          </div>

          {/* ── Score blocker ─────────────────────────────────────────── */}
          {(!isAuditReady || showScoreBlocker) && (
            <div className="flex gap-2.5 rounded-[var(--r-sm)] border border-destructive/40 bg-[var(--danger-soft)] px-3.5 py-3">
              <AlertTriangle size={15} className="mt-px shrink-0 text-destructive" />
              <div>
                <p className="mb-0.5 mt-0 font-sans text-[13px] font-semibold text-destructive">
                  {showScoreBlocker ? "Approval attempt blocked" : "Sign-off blocked by quality score"}
                </p>
                <p className="m-0 font-sans text-xs text-foreground-tertiary">
                  {showScoreBlocker
                    ? "Improve the CAPA score through D1–D6 before attempting electronic sign-off."
                    : "Quality score must reach 80 before this CAPA can be approved and closed as Audit Ready."}
                </p>
              </div>
            </div>
          )}

          {/* ── Comprehensive review ──────────────────────────────────── */}
          <ComprehensiveReview capa={capa} />

          {/* ── Final quality gate ────────────────────────────────────── */}
          <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border-subtle bg-elevated px-4 py-3.5">
              <ShieldCheck size={14} className="shrink-0 text-primary" />
              <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">
                Final Quality Gate
              </p>
            </div>
            <div className="grid grid-cols-3">
              {[
                {
                  label: "Final Score",
                  value: <ScorePill score={capa.score.total} />,
                },
                {
                  label: "Required Status",
                  value: (
                    <span className={cn("font-sans text-[13px] font-semibold", isAuditReady ? "text-success" : "text-warning")}>
                      {isAuditReady ? "Audit Ready" : "Needs Improvement"}
                    </span>
                  ),
                },
                {
                  label: "Closure State",
                  value: (
                    <span className="font-sans text-[13px] font-semibold text-foreground-secondary">
                      {isClosed ? "Closed" : allApproved ? "Ready to Close" : "Approval Pending"}
                    </span>
                  ),
                },
              ].map((cell, i) => (
                <div
                  key={cell.label}
                  className={cn("px-4 py-3.5", i < 2 && "border-r border-border-subtle")}
                >
                  <p className="mb-2 mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">
                    {cell.label}
                  </p>
                  {cell.value}
                </div>
              ))}
            </div>
          </div>

          {/* ── Approval chain ────────────────────────────────────────── */}
          <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card shadow-sm">
            <div className="border-b border-border-subtle bg-elevated px-4 py-3.5">
              <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">
                Approval Chain
              </p>
            </div>
            <div className="flex flex-col">
              {approvalChain.map((approver, index) => {
                const approval = getApprovalFor(capa.approvals, approver.personaId);
                const isApproved = approval?.decision === "approved";
                const isRejected = approval?.decision === "rejected";
                const canAct = isAuditReady && !isClosed && nextApprover?.personaId === approver.personaId;

                return (
                  <div
                    key={approver.personaId}
                    className={cn(
                      "p-4",
                      index < approvalChain.length - 1 && "border-b border-border-subtle",
                      isApproved ? "bg-[var(--success-soft)]" : isRejected ? "bg-[var(--danger-soft)]" : "bg-transparent",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 flex-1 gap-3">
                        {/* Status icon */}
                        <div className="shrink-0 pt-0.5">
                          {isApproved ? (
                            <CheckCircle2 size={18} className="text-success" />
                          ) : isRejected ? (
                            <XCircle size={18} className="text-destructive" />
                          ) : (
                            <Circle size={18} className="text-foreground-faint" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="mb-0.5 mt-0 font-sans text-[13px] font-semibold text-foreground">
                            {index + 1}. {approver.name}
                          </p>
                          <p className="m-0 text-xs text-foreground-tertiary">{approver.role}</p>
                          {approval?.signedAt && (
                            <p className="mb-0 mt-1.5 font-sans text-[11px] text-foreground-faint">
                              Signed {formatDateTime(approval.signedAt)}
                            </p>
                          )}
                          {approval?.notes && (
                            <p className="mb-0 mt-2 rounded-[var(--r-sm)] border border-border-subtle bg-elevated px-2.5 py-1.5 text-xs italic text-foreground-tertiary">
                              {approval.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: status badge + action */}
                      <div className="flex shrink-0 items-center gap-2.5">
                        {isApproved && (
                          <span className="rounded-[var(--r-full)] border border-success/40 bg-[var(--success-soft)] px-2 py-0.5 font-sans text-[11px] font-semibold text-success">
                            Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="rounded-[var(--r-full)] border border-destructive/40 bg-[var(--danger-soft)] px-2 py-0.5 font-sans text-[11px] font-semibold text-destructive">
                            Rejected
                          </span>
                        )}
                        {!approval && (
                          <span className={cn("rounded-[var(--r-full)] border px-2 py-0.5 font-sans text-[11px] font-semibold", canAct ? "border-warning/40 bg-[var(--warning-soft)] text-warning" : "border-border-subtle bg-elevated text-foreground-faint")}>
                            {canAct ? "Awaiting" : "Pending"}
                          </span>
                        )}
                        <button
                          type="button"
                          disabled={!canAct}
                          onClick={() => openESignature(approver)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-[var(--r-sm)] px-3.5 py-[7px] font-sans text-xs font-semibold",
                            canAct
                              ? "cursor-pointer border-0 bg-[image:var(--grad-brand)] text-primary-foreground opacity-100"
                              : "cursor-not-allowed border border-[var(--line-2)] bg-field text-foreground-faint opacity-50",
                          )}
                        >
                          <PenLine size={13} />
                          Approve with E-Sig
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Closed state banner ───────────────────────────────────── */}
          {isClosed && (
            <div className="flex gap-3 rounded-[var(--r-md)] border border-success/30 bg-[var(--success-soft)] px-4 py-3.5">
              <ShieldCheck size={18} className="mt-px shrink-0 text-success" />
              <div>
                <p className="mb-0.5 mt-0 font-sans text-[13px] font-semibold text-success">
                  CAPA Closed as Audit Ready
                </p>
                <p className="m-0 text-xs text-foreground-tertiary">
                  All required approvers have signed off. {capa.id} is now marked Audit Ready and closed.
                </p>
              </div>
            </div>
          )}

        </div>
      </EightDShell>

      {/* ── E-signature modal ───────────────────────────────────────────── */}
      {selectedApprover && (
        <ESignatureModal
          approver={selectedApprover}
          onApprove={(notes) => submitDecision("approved", notes)}
          onReject={(notes) => submitDecision("rejected", notes)}
          onClose={() => setSelectedApprover(undefined)}
        />
      )}
    </>
  );
}
