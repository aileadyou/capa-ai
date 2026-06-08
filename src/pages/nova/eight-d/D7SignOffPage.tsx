import { useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { EightDShell } from "@/components/layout/EightDShell";
import { ApprovalChainPanel } from "@/components/capa/ApprovalChainPanel";
import { NovaAssistPanel } from "@/components/nova/NovaAssistPanel";
import { NovaSuggestionBlock } from "@/components/nova/NovaSuggestionBlock";
import { ScorePill } from "@/components/shared/ScorePill";
import NotFound from "@/pages/NotFound";
import { usePersonaStore } from "@/store";
import { useCapa } from "@/hooks/api";
import type { CAPACase, CorrectiveAction, PreventiveAction } from "@/types";
import {
  approverRoleLabel,
  getCycleByStage,
  getFinalStage,
  resolveCycleApprovers,
} from "@/config/workflows";
import { formatCAPAType, formatDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";

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
        <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
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
                  <p className="mb-1 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
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
          <p className="mb-2 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
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
              <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
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

// ── Workflow context (read-only loop chips) ───────────────────────────────────
// RFI loops (closing-completeness, external report-back, internal Lead-Auditor
// review, complaint customer-response) are modelled as real fields defaulted to
// their resolved state and surfaced here as read-only chips — present without
// lengthening the live click-through.

function ContextChip({
  resolved,
  children,
}: {
  resolved: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--r-full)] border px-2.5 py-1 font-sans text-[11px] font-medium",
        resolved
          ? "border-success/40 bg-[var(--success-soft)] text-success"
          : "border-warning/40 bg-[var(--warning-soft)] text-warning",
      )}
    >
      {resolved ? <CheckCircle2 size={12} className="shrink-0" /> : <Clock size={12} className="shrink-0" />}
      {children}
    </span>
  );
}

function WorkflowContextCard({ capa }: { capa: CAPACase }) {
  const chips: React.ReactNode[] = [];

  if (capa.type === "audit" && capa.auditContext) {
    const { variant, leadAuditorReviewedAt, reportBackAt } = capa.auditContext;
    if (variant === "internal") {
      chips.push(
        <ContextChip key="lead" resolved={Boolean(leadAuditorReviewedAt)}>
          {leadAuditorReviewedAt
            ? `Lead Auditor reviewed ${formatDate(leadAuditorReviewedAt)}`
            : "Lead Auditor review pending"}
        </ContextChip>,
      );
    }
    if (capa.closingCompleteness) {
      const { complete, pendingDocs } = capa.closingCompleteness;
      chips.push(
        <ContextChip key="closing" resolved={complete}>
          {complete
            ? "Closing documents complete"
            : `Pending: ${(pendingDocs ?? []).join(", ") || "closing documents"}`}
        </ContextChip>,
      );
    }
    if (variant === "external") {
      chips.push(
        <ContextChip key="report" resolved={Boolean(reportBackAt)}>
          {reportBackAt
            ? `Reported back to external auditor ${formatDate(reportBackAt)}`
            : "Report-back to external auditor pending"}
        </ContextChip>,
      );
    }
  }

  if (capa.type === "complaint" && capa.customerResponse) {
    const { responseSentAt, customerReplied, replyDueAt, closedAt } = capa.customerResponse;
    chips.push(
      <ContextChip key="sent" resolved={Boolean(responseSentAt)}>
        {responseSentAt ? `Customer response sent ${formatDate(responseSentAt)}` : "Customer response not sent"}
      </ContextChip>,
    );
    chips.push(
      <ContextChip key="reply" resolved={Boolean(customerReplied)}>
        {customerReplied
          ? "Customer replied"
          : `Awaiting customer reply${replyDueAt ? ` (due ${formatDate(replyDueAt)})` : ""}`}
      </ContextChip>,
    );
    if (closedAt) {
      chips.push(
        <ContextChip key="closed" resolved>
          Customer loop closed {formatDate(closedAt)}
        </ContextChip>,
      );
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card shadow-sm">
      <div className="border-b border-border-subtle bg-elevated px-4 py-3.5">
        <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Workflow Context
        </p>
      </div>
      <div className="flex flex-wrap gap-2 px-4 py-3.5">{chips}</div>
    </div>
  );
}

function buildSignOffReadinessSuggestion(
  capa: CAPACase,
  approverRoles: string[],
  isAuditReady: boolean,
) {
  const missingItems = [
    capa.correctiveActions.length === 0 ? "corrective actions are not recorded" : "",
    capa.preventiveActions.length === 0 ? "preventive actions are not recorded" : "",
    !capa.verification.method ? "verification method is missing" : "",
    !capa.verification.result ? "verification result narrative is missing" : "",
    capa.verification.evidenceFileNames.length === 0 ? "verification evidence filename is missing" : "",
    !isAuditReady ? `quality score is ${capa.score.total}, below the sign-off threshold of 80` : "",
  ].filter(Boolean);

  if (missingItems.length > 0) {
    return `Do not proceed to final sign-off yet. Before approving ${capa.id}, resolve: ${missingItems.join("; ")}. After those items are closed, route the CAPA through ${approverRoles.join(" → ")} for e-signature.`;
  }

  return `${capa.id} appears ready for D7 sign-off review. The CAPA has a quality score of ${capa.score.total}, recorded RCA, corrective/preventive actions, and verification evidence. Approvers should still confirm that the evidence file(s), action completion records, and D1-D6 narratives match the source finding before e-signature.`;
}

// ── Component ────────────────────────────────────────────────────────────────

export function D7SignOffPage() {
  const { id } = useParams();
  const { data: capa } = useCapa(id);
  const personas = usePersonaStore((state) => state.personas);

  if (!capa) {
    return <NotFound message={`CAPA ${id ?? ""} is not available in the demo dataset.`} />;
  }

  const isAuditReady = capa.score.total >= 80;
  const isClosed = capa.status === "closed";
  const finalStage = getFinalStage(capa);
  const finalCycle = getCycleByStage(capa, finalStage);
  const finalApprovers = finalCycle ? resolveCycleApprovers(finalCycle, capa) : [];
  const approverRoles = finalCycle
    ? finalApprovers.map((personaId) =>
        approverRoleLabel(finalCycle, personaId, personas.find((p) => p.id === personaId)?.role ?? personaId),
      )
    : [];
  const finalApprovedIds = new Set(
    capa.approvals
      .filter((a) => a.decision === "approved" && (a.stage === finalStage || a.stage == null))
      .map((a) => a.approverPersonaId),
  );
  const allApproved =
    finalApprovers.length > 0 && finalApprovers.every((personaId) => finalApprovedIds.has(personaId));
  const signOffReadinessSuggestion = buildSignOffReadinessSuggestion(capa, approverRoles, isAuditReady);

  return (
    <EightDShell capaId={capa.id} activeStep="signoff">
      <div className="flex flex-col gap-6">

        {/* ── Page header ───────────────────────────────────────────── */}
        <div>
          <p className="mb-1.5 mt-0 font-sans text-xs tracking-[0.18em] text-primary">
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
            Complete the e-signature approval chain for {capa.id}. Approvals can be recorded by each assigned persona; final Audit Ready closure requires quality score 80 or higher.
          </p>
        </div>

        {/* ── Score blocker ─────────────────────────────────────────── */}
        {!isAuditReady && (
          <div role="alert" className="flex gap-2.5 rounded-[var(--r-sm)] border border-destructive/40 bg-[var(--danger-soft)] px-3.5 py-3">
            <AlertTriangle size={15} aria-hidden="true" className="mt-px shrink-0 text-destructive" />
            <div>
              <p className="mb-0.5 mt-0 font-sans text-[13px] font-semibold text-destructive">
                Closure blocked by quality score
              </p>
              <p className="m-0 font-sans text-xs text-foreground-tertiary">
                Quality score must reach 80 before this CAPA can be closed as Audit Ready. Assigned approvers can still record their e-signatures.
              </p>
            </div>
          </div>
        )}

        {/* ── Comprehensive review ──────────────────────────────────── */}
        <ComprehensiveReview capa={capa} />

        {/* ── Nova sign-off readiness assist ────────────────────────── */}
        <NovaAssistPanel
          title="Ask Nova to review sign-off readiness"
          description="Use Nova as a final reviewer before e-signature. The draft focuses on D1-D6 completeness, score readiness, evidence, and approval-chain risk."
        >
          <NovaSuggestionBlock
            context="D7 sign-off readiness"
            suggestion={signOffReadinessSuggestion}
            reasoning={`Based on ${capa.id} D1-D6 summary, score ${capa.score.total}/100, ${capa.correctiveActions.length} corrective actions, ${capa.preventiveActions.length} preventive actions, and ${capa.verification.evidenceFileNames.length} verification evidence file(s).`}
            capaId={capa.id}
            suggestionId="d7-signoff"
          />
        </NovaAssistPanel>

        {/* ── Final quality gate ────────────────────────────────────── */}
        <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border-subtle bg-elevated px-4 py-3.5">
            <ShieldCheck size={14} className="shrink-0 text-primary" />
            <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
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
                <p className="mb-2 mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  {cell.label}
                </p>
                {cell.value}
              </div>
            ))}
          </div>
        </div>

        {/* ── Workflow context (read-only loop chips) ───────────────── */}
        <WorkflowContextCard capa={capa} />

        {/* ── Closing approval cycle (config-driven) ────────────────── */}
        <ApprovalChainPanel capa={capa} stage={finalStage} />

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
  );
}
