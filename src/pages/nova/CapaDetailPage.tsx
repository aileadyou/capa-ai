import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CircleDot,
  Download,
  Lock,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import NotFound from "@/pages/NotFound";
import { EightDEmbedProvider } from "@/components/layout/EightDShell";
import { D1ProblemPage } from "@/pages/nova/eight-d/D1ProblemPage";
import { D2ContainmentPage } from "@/pages/nova/eight-d/D2ContainmentPage";
import { D3RCAPage } from "@/pages/nova/eight-d/D3RCAPage";
import { D4CorrectiveActionPage } from "@/pages/nova/eight-d/D4CorrectiveActionPage";
import { D5PreventiveActionPage } from "@/pages/nova/eight-d/D5PreventiveActionPage";
import { D6VerificationPage } from "@/pages/nova/eight-d/D6VerificationPage";
import { D7SignOffPage } from "@/pages/nova/eight-d/D7SignOffPage";
import { eightDSteps } from "@/routes";
import { useAuditTrailStore, useCapaStore, usePersonaStore } from "@/store";
import type {
  AuditDomain,
  AuditEvent,
  AuditEventType,
  CAPACase,
  EightDStep,
  IntakeDecision,
  PersonaID,
  PreFillContext,
} from "@/types";
import { formatCAPAType, formatDate, formatDateTime } from "@/utils/formatters";
import { getScoreLiftTips } from "@/utils/scoring";
import { canFillCAPA } from "@/utils/personaAccess";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/* ── Mock due dates (no dueDate field in data) ───────────────────── */
const MOCK_DUE: Record<string, string> = {
  "CAPA-2026-0341": "2026-06-06",
  "CAPA-2026-0089": "2026-06-03",
  "CAPA-2026-0112": "2026-06-12",
};

/* ── Step labels ─────────────────────────────────────────────────── */
const STEP_LABELS: Record<EightDStep, string> = {
  problem: "D1 Problem statement",
  containment: "D2 Containment",
  rca: "D3 Root cause analysis",
  ca: "D4 Corrective action",
  pa: "D5 Preventive action",
  verification: "D6 Verification",
  signoff: "D7 Sign-off",
};

const STEP_SHORT: Record<EightDStep, string> = {
  problem: "D1",
  containment: "D2",
  rca: "D3",
  ca: "D4",
  pa: "D5",
  verification: "D6",
  signoff: "D7",
};

const EMBEDDED_STEP_COMPONENTS: Record<EightDStep, React.ComponentType> = {
  problem: D1ProblemPage,
  containment: D2ContainmentPage,
  rca: D3RCAPage,
  ca: D4CorrectiveActionPage,
  pa: D5PreventiveActionPage,
  verification: D6VerificationPage,
  signoff: D7SignOffPage,
};

/* ── Helpers ─────────────────────────────────────────────────────── */

// While a CAPA sits in the intake review gate, the 8D investigation is locked —
// Andi cannot start filling steps until both reviewers approve.
const INTAKE_BLOCKED_STATUSES = ["pending_review", "revision_requested", "rejected"];
const isIntakeBlocked = (status: string) => INTAKE_BLOCKED_STATUSES.includes(status);

function getStepState(
  step: EightDStep,
  currentStep: EightDStep,
  status: string,
): "done" | "active" | "locked" {
  if (status === "closed") return "done";
  if (isIntakeBlocked(status)) return "locked";
  const ci = eightDSteps.indexOf(currentStep);
  const si = eightDSteps.indexOf(step);
  if (si < ci) return "done";
  if (si === ci) return "active";
  return "locked";
}

function getCtaLabel(step: EightDStep): string {
  return `Continue working on ${STEP_SHORT[step]}`;
}

function getSourceSystem(prefill: PreFillContext): string {
  return prefill.source === "Bizzmine-Complaint" ? "Bizzmine" : prefill.source;
}

/* ── Shared class shortcuts ──────────────────────────────────────── */
const MONO_EYEBROW_CLASS = "font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-primary font-extrabold";

/* ════════════════════════════════════════════════════════════════════
   LEFT COLUMN — 8D Progress + CAPA Info + Score
   ════════════════════════════════════════════════════════════════════ */

function EyebrowLeft({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-2 mt-0 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-foreground-secondary font-semibold"
    >
      {children}
    </p>
  );
}

function StepItem({
  step,
  state,
  isSelected,
  onSelect,
}: {
  step: EightDStep;
  state: "done" | "active" | "locked";
  isSelected: boolean;
  onSelect: () => void;
}) {
  // "active"  = user is currently viewing this step
  // "current" = workflow's in-progress checkpoint, but user is viewing something else
  const visualState = isSelected
    ? "active"
    : state === "active"
      ? "current"
      : state;

  const icon = {
    done: <Check size={12} strokeWidth={2.5} />,
    active: <CircleDot size={12} strokeWidth={2} />,
    current: <CircleDot size={12} strokeWidth={2} />,
    locked: <Lock size={11} strokeWidth={2} />,
  }[visualState];

  const content = (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[var(--r-sm)] px-2.5 py-2 font-sans text-xs no-underline transition-[background] duration-200",
        visualState === "done" && "cursor-pointer border border-border-subtle bg-card text-foreground-tertiary",
        visualState === "active" && "cursor-pointer border border-l-[3px] border-[var(--accent-line)] border-l-primary bg-[var(--accent-soft)] font-semibold text-primary",
        visualState === "current" && "cursor-pointer border border-border-subtle bg-card text-foreground-secondary",
        visualState === "locked" && "cursor-not-allowed border border-border-subtle bg-background text-foreground-faint",
      )}
    >
      <span className={cn("shrink-0", state === "locked" && "opacity-50")}>{icon}</span>
      <span
        className={cn("mr-0.5 font-sans text-[10px] font-semibold", state === "locked" && "opacity-50")}
      >
        {STEP_SHORT[step]}
      </span>
      <div className="flex flex-col gap-1">
      <span className="flex-1 text-xs">
        {STEP_LABELS[step].replace(/^D\d+ /, "")}
      </span>
      {visualState === "current" && (
        <span className="shrink-0 rounded-[var(--r-full)] bg-warning/15 px-1.5 py-px font-sans text-[9px] font-semibold uppercase tracking-[0.08em] text-warning">
          In progress
        </span>
      )}
      </div>
    </div>
  );

  if (state === "locked") {
    return <div>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left"
    >
      {content}
    </button>
  );
}

function LeftColumn({
  capa,
  selectedStep,
  onSelectStep,
  onOverview,
}: {
  capa: CAPACase;
  selectedStep: EightDStep | null;
  onSelectStep: (step: EightDStep) => void;
  onOverview: () => void;
}) {
  return (
    <div
      className="sticky top-[72px] flex h-[calc(100vh-96px)] w-[220px] shrink-0 flex-col gap-5 overflow-y-auto pr-1"
    >
      {/* Overview shortcut */}
      <button
        type="button"
        onClick={onOverview}
        className={cn(
          "flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[var(--r-sm)] px-2.5 py-[7px] font-sans text-xs font-semibold transition-[background,color,border-color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
          selectedStep === null
            ? "border border-[var(--accent-line)] bg-[var(--accent-soft)] text-primary"
            : "border border-[var(--line-2)] bg-card text-foreground-secondary",
        )}
      >
        Overview
      </button>

      {/* 8D Progress */}
      <div>
        <EyebrowLeft>8D Progress</EyebrowLeft>
        <div className="flex flex-col gap-1">
          {eightDSteps.map((step) => (
            <StepItem
              key={step}
              step={step}
              state={getStepState(step, capa.currentStep, capa.status)}
              isSelected={selectedStep === step}
              onSelect={() => onSelectStep(step)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MIDDLE COLUMN — Content
   ════════════════════════════════════════════════════════════════════ */

function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "whitespace-nowrap rounded-[var(--r-full)] border border-[var(--line-2)] bg-elevated px-2.5 py-[3px] font-sans text-[11px] font-medium text-foreground-secondary",
        className,
      )}
    >
      {children}
    </span>
  );
}

function InfoGrid({ rows }: { rows: Array<{ label: string; value: string; span?: boolean }> }) {
  return (
    <div
      className="grid grid-cols-2 gap-x-6 gap-y-3"
    >
      {rows.map(({ label, value, span }) =>
        value ? (
          <div key={label} className={cn(span && "col-span-full")}>
            <p
              className={cn(MONO_EYEBROW_CLASS, "mb-[3px] mt-0 ")}
            >
              {label}
            </p>
            <p
              className="m-0 font-sans text-[13px] leading-6 text-foreground-secondary"
            >
              {value}
            </p>
          </div>
        ) : null,
      )}
    </div>
  );
}

function Card({
  children,
  accent = false,
  surface = "card",
}: {
  children: React.ReactNode;
  accent?: boolean;
  surface?: "card" | "elevated";
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--r-md)] border border-[var(--line-2)] px-5 py-4 shadow-sm",
        surface === "elevated" ? "bg-elevated" : "bg-card",
        accent && "border-l-[3px] border-l-primary",
      )}
    >
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-3 mt-0 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-foreground-tertiary"
    >
      {children}
    </p>
  );
}

function SourceDataCard({ prefill }: { prefill: PreFillContext }) {
  let rows: Array<{ label: string; value: string; span?: boolean }> = [];

  if (prefill.source === "Bizzmine") {
    rows = [
      { label: "Deviation ID", value: prefill.deviationId ?? "" },
      { label: "Reported", value: prefill.reportedAt ? formatDateTime(prefill.reportedAt) : "" },
      { label: "Area", value: prefill.location?.area ?? "" },
      { label: "Line", value: prefill.location?.line ?? "" },
      { label: "Equipment", value: prefill.location?.equipmentId ?? "" },
      { label: "Initiator", value: prefill.initiator?.name ? `${prefill.initiator.name} · ${prefill.initiator.role}` : "" },
      { label: "Affected batches", value: prefill.affectedBatches?.join(", ") ?? "" },
      { label: "SOP references", value: prefill.sopReferences?.join(", ") ?? "" },
      { label: "Initial observation", value: prefill.initialObservation ?? "", span: true },
    ];
  } else if (prefill.source === "Q100+") {
    rows = [
      { label: "Finding ID", value: (prefill as any).findingId ?? "" },
      { label: "Audit ID", value: (prefill as any).auditId ?? "" },
      { label: "Audit type", value: (prefill as any).auditType ?? "" },
      { label: "Audit date", value: (prefill as any).auditDate ? formatDateTime((prefill as any).auditDate) : "" },
      { label: "Auditor", value: (prefill as any).auditor?.name ? `${(prefill as any).auditor.name} · ${(prefill as any).auditor.organization}` : "" },
      { label: "Auditee dept", value: (prefill as any).auditee?.department ?? "" },
      { label: "Category", value: (prefill as any).findingCategory ?? "" },
      { label: "Regulation", value: (prefill as any).regulationReference?.join(", ") ?? "" },
      { label: "Finding description", value: (prefill as any).findingDescription ?? "", span: true },
    ];
  } else {
    rows = [
      { label: "Complaint ID", value: (prefill as any).complaintId ?? "" },
      { label: "Reported", value: prefill.reportedAt ? formatDateTime(prefill.reportedAt) : "" },
      { label: "Customer", value: (prefill as any).customer?.name ? `${(prefill as any).customer.name} · ${(prefill as any).customer.type}` : "" },
      { label: "Product", value: (prefill as any).product?.name ?? "" },
      { label: "Lot number", value: (prefill as any).product?.lotNumber ?? "" },
      { label: "Complaint type", value: (prefill as any).complaintType ?? "" },
      { label: "Description", value: (prefill as any).description ?? "", span: true },
    ];
  }

  return (
    <Card>
      <CardLabel>Source data</CardLabel>
      <InfoGrid rows={rows} />
    </Card>
  );
}

const INTAKE_DECISION_STYLE: Record<string, { pill: string; label: string }> = {
  accepted: { pill: "bg-[var(--success-soft)] text-success", label: "Continue to CAPA" },
  revision_requested: { pill: "bg-[var(--warning-soft)] text-warning", label: "Sent for Re-work" },
  rejected: { pill: "bg-[var(--danger-soft)] text-destructive", label: "Rejected" },
};

/** One reviewer's decision controls — only shown for the active persona's own pending row. */
function IntakeDecisionControls({
  capaId,
  reviewerPersonaId,
}: {
  capaId: string;
  reviewerPersonaId: PersonaID;
}) {
  const recordIntakeDecision = useCapaStore((s) => s.recordIntakeDecision);
  const [notes, setNotes] = useState("");

  function decide(decision: IntakeDecision, label: string) {
    recordIntakeDecision(capaId, reviewerPersonaId, decision, notes);
    toast.success(`Decision recorded: ${label}`, {
      description:
        decision === "accepted"
          ? "Once both reviewers continue, Andi can start the 8D investigation."
          : decision === "revision_requested"
            ? "Andi will be asked to revise the intake and resubmit."
            : "The CAPA has been rejected at intake.",
    });
  }

  return (
    <div className="mt-3 border-t border-border-subtle pt-3">
      <p className="mb-1.5 mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">
        Your intake decision
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        aria-label="Intake decision notes for Andi"
        placeholder="Notes for Andi (optional) — what to fix, or why you're rejecting."
        className="box-border mb-2.5 w-full resize-y rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-3 py-2 font-sans text-[13px] leading-[1.5] text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => decide("accepted", "Continue to CAPA")}
          className="flex-1 cursor-pointer rounded-[var(--r-sm)] border-0 bg-[image:var(--grad-brand)] px-3 py-2 font-sans text-[13px] font-semibold text-primary-foreground"
        >
          Continue to CAPA
        </button>
        <button
          type="button"
          onClick={() => decide("revision_requested", "Send for Re-work")}
          className="flex-1 cursor-pointer rounded-[var(--r-sm)] border border-warning/40 bg-[var(--warning-soft)] px-3 py-2 font-sans text-[13px] font-semibold text-warning"
        >
          Send for Re-work
        </button>
        <button
          type="button"
          onClick={() => decide("rejected", "Reject")}
          className="flex-1 cursor-pointer rounded-[var(--r-sm)] border border-destructive/40 bg-[var(--danger-soft)] px-3 py-2 font-sans text-[13px] font-semibold text-destructive"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

function IntakeReviewCard({ capa }: { capa: CAPACase }) {
  const activePersonaId = usePersonaStore((s) => s.activePersonaId);
  const reviews = capa.intakeReviews ?? [];

  return (
    <Card>
      <CardLabel>Intake Review</CardLabel>
      <div className="flex flex-col gap-3 pt-1">
        {reviews.map((r) => {
          const ds = r.decision ? INTAKE_DECISION_STYLE[r.decision] : null;
          const isActiveReviewer = r.reviewerPersonaId === activePersonaId;
          const canDecide = isActiveReviewer && !r.decision && capa.status === "pending_review";
          return (
            <div
              key={r.reviewerPersonaId}
              className={cn(
                "rounded-[var(--r-sm)] border bg-elevated px-3 py-2.5",
                canDecide ? "border-[var(--accent-line)]" : "border-border-subtle",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="mb-0.5 mt-0 font-sans text-[13px] font-semibold text-foreground">
                    {r.reviewerName}
                    {isActiveReviewer && (
                      <span className="ml-1.5 rounded-[var(--r-full)] bg-[var(--accent-soft)] px-1.5 py-px font-sans text-[10px] font-semibold text-primary">
                        You
                      </span>
                    )}
                  </p>
                  <p className="m-0 text-xs text-foreground-tertiary">{r.role}</p>
                  {r.notes && (
                    <p className="mb-0 mt-1.5 text-xs italic text-foreground-tertiary">
                      "{r.notes}"
                    </p>
                  )}
                  {r.reviewedAt && (
                    <p className="mb-0 mt-1 font-sans text-[11px] text-foreground-faint">
                      {formatDateTime(r.reviewedAt)}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  {ds ? (
                    <span className={`rounded-[var(--r-full)] px-2.5 py-0.5 font-sans text-[11px] font-semibold ${ds.pill}`}>
                      {ds.label}
                    </span>
                  ) : (
                    <span className="rounded-[var(--r-full)] border border-border-subtle bg-field px-2.5 py-0.5 font-sans text-[11px] text-foreground-faint">
                      Pending
                    </span>
                  )}
                </div>
              </div>
              {canDecide && (
                <IntakeDecisionControls capaId={capa.id} reviewerPersonaId={r.reviewerPersonaId} />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/** Read-only view of Andi's intake answers, so reviewers can judge gate quality + severity. */
function IntakeSubmissionCard({ capa }: { capa: CAPACase }) {
  if (capa.gateAnswers.length === 0) return null;
  const impact = capa.impact;
  const isMinor = impact.severity === "Minor";
  const hasRationale =
    Boolean(impact.rationale) &&
    impact.rationale !== "Nova will classify this finding during intake.";
  const hasFactors = impact.factors.length > 0;
  return (
    <Card>
      <CardLabel>Intake submission</CardLabel>
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <Pill>Title: {capa.title}</Pill>
      </div>

      {/* Severity assessment — the classification Andi set, with its justification so
          reviewers can judge whether the severity level is appropriate. */}
      <div className="mb-4 rounded-[var(--r-md)] border-l-[3px] border-l-primary bg-elevated px-4 py-3.5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">
            Severity set by initiator
          </span>
          <span
            className={cn(
              "rounded-[var(--r-full)] px-2 py-px font-sans text-[11px] font-bold",
              isMinor
                ? "bg-[var(--warning-soft)] text-warning"
                : "bg-[var(--danger-soft)] text-destructive",
            )}
          >
            {impact.severity}
          </span>
          {impact.totalWeight > 0 && (
            <span className="ml-auto font-sans text-[11px] text-foreground-tertiary">
              {Math.round(impact.totalWeight)}% confidence
            </span>
          )}
        </div>
        {hasRationale && (
          <p className="mb-2.5 mt-0 font-sans text-xs leading-[1.55] text-foreground-secondary">
            {impact.rationale}
          </p>
        )}
        {hasFactors && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-2">
            {impact.factors.map((factor) => (
              <div
                key={factor.factor}
                className="rounded-[var(--r-sm)] border border-border-subtle bg-[var(--field-bg)] px-2.5 py-2"
              >
                <p className="mb-[3px] mt-0 font-sans text-[10px] uppercase tracking-[0.18em] text-foreground-tertiary">
                  {factor.factor}
                </p>
                <p className="mb-1 mt-0 font-sans text-xs text-foreground-secondary">
                  {factor.value}
                </p>
                <p className="m-0 font-sans text-[10px] text-primary">Weight {factor.weight}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gate question answers filled by Andi */}
      <p className="mb-2.5 mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">
        Gate questions
      </p>
      <div className="flex flex-col gap-5">
        {capa.gateAnswers.map((answer, index) => (
          <div key={answer.questionId}>
            <p className="mb-1 mt-0 font-sans text-[12px] font-bold leading-[1.5] text-primary ">
              <span>{index +1}. </span>{answer.question}
            </p>
            <p className="m-0 pl-4 font-sans text-[13px] leading-[1.6] text-foreground-secondary">
              {answer.answer}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function NovaSummaryCard({ capa }: { capa: CAPACase }) {
  const rootCause =
    capa.rca.confirmedRootCauses[0] ?? "Root cause confirmation is still in progress.";

  return (
    <Card surface="elevated" accent>
      <div className="mb-2.5 flex items-center gap-2">
        <Sparkles
          size={14}
          strokeWidth={1.75}
          className="shrink-0 text-primary"
        />
        <CardLabel>Nova Summary</CardLabel>
      </div>
      <p className="mb-3 mt-0 text-[13px] leading-[1.65] text-foreground-secondary">
        {capa.impact.rationale}
      </p>
      {capa.rca.confirmedRootCauses.length > 0 && (
        <div
          className="rounded-[var(--r-sm)] bg-field px-3 py-2.5 text-xs text-foreground-tertiary"
        >
          <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-foreground-tertiary">
            Confirmed root cause
          </span>
          <p className="mt-1 text-[13px] leading-[1.6] text-foreground-secondary">
            {rootCause}
          </p>
        </div>
      )}
    </Card>
  );
}

function statusTone(status: string): string {
  if (["completed", "verified", "approved"].includes(status)) {
    return "bg-[var(--success-soft)] text-success";
  }
  if (["overdue", "rejected"].includes(status)) {
    return "bg-[var(--danger-soft)] text-destructive";
  }
  if (["in_progress", "pending"].includes(status)) {
    return "bg-[var(--warning-soft)] text-warning";
  }
  return "bg-field text-foreground-tertiary";
}

function EmptyStepState({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[var(--r-md)] border border-border-subtle bg-elevated p-4 text-[13px] leading-[1.6] text-foreground-tertiary"
    >
      {children}
    </div>
  );
}

function StepDetailView({
  capa,
  step,
  onBackToOverview,
}: {
  capa: CAPACase;
  step: EightDStep;
  onBackToOverview: () => void;
}) {
  const stepState = getStepState(step, capa.currentStep, capa.status);
  const containmentAnswer = capa.gateAnswers.find((answer) => answer.questionId === "containment");
  const problemAnswer = capa.gateAnswers.find((answer) => answer.questionId === "observation");
  const stepTone = stepState === "done"
    ? "bg-[var(--success-soft)] text-success"
    : stepState === "active"
      ? "bg-[var(--accent-soft)] text-primary"
      : "bg-field text-foreground-tertiary";

  const renderStepBody = () => {
    switch (step) {
      case "problem":
        return (
          <Card>
            <CardLabel>Problem statement</CardLabel>
            <p className="m-0 text-[13px] leading-[1.7] text-foreground-secondary">
              {problemAnswer?.answer || "Problem statement has not been saved yet."}
            </p>
          </Card>
        );
      case "containment":
        return (
          <Card>
            <CardLabel>Immediate containment</CardLabel>
            {containmentAnswer ? (
              <p className="m-0 whitespace-pre-line text-[13px] leading-[1.7] text-foreground-secondary">
                {containmentAnswer.answer}
              </p>
            ) : (
              <EmptyStepState>No containment action has been saved yet.</EmptyStepState>
            )}
          </Card>
        );
      case "rca":
        return (
          <Card>
            <CardLabel>Root cause analysis</CardLabel>
            <InfoGrid rows={[{ label: "Method", value: capa.rca.method }]} />
            <div className="mt-3.5 flex flex-col gap-2.5">
              {capa.rca.confirmedRootCauses.length > 0 ? (
                capa.rca.confirmedRootCauses.map((cause, index) => (
                  <div
                    key={`${cause}-${index}`}
                    className="rounded-[var(--r-sm)] border border-border-subtle bg-elevated px-3 py-2.5 text-[13px] leading-[1.6] text-foreground-secondary"
                  >
                    {cause}
                  </div>
                ))
              ) : (
                <EmptyStepState>No confirmed root cause yet.</EmptyStepState>
              )}
            </div>
          </Card>
        );
      case "ca":
        return (
          <Card>
            <CardLabel>Corrective actions</CardLabel>
            {capa.correctiveActions.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {capa.correctiveActions.map((action) => {
                  const tone = statusTone(action.status);
                  return (
                    <div
                      key={action.id}
                      className="rounded-[var(--r-md)] border border-border-subtle bg-elevated px-3.5 py-3"
                    >
                      <div className="mb-2 flex justify-between gap-3">
                        <p className="m-0 text-[13px] font-semibold text-foreground">
                          {action.id}
                        </p>
                        <Pill className={tone}>{action.status.replace("_", " ")}</Pill>
                      </div>
                      <p className="mb-2.5 mt-0 text-[13px] leading-[1.6] text-foreground-secondary">
                        {action.description}
                      </p>
                      <InfoGrid
                        rows={[
                          { label: "PIC", value: action.pic },
                          { label: "Due date", value: formatDate(action.dueDate) },
                          { label: "Linked root cause", value: action.linkedRootCause, span: true },
                          { label: "Verification", value: action.verificationMethod, span: true },
                        ]}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyStepState>No corrective actions have been added yet.</EmptyStepState>
            )}
          </Card>
        );
      case "pa":
        return (
          <Card>
            <CardLabel>Preventive actions</CardLabel>
            {capa.preventiveActions.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {capa.preventiveActions.map((action) => {
                  const tone = statusTone(action.status);
                  return (
                    <div
                      key={action.id}
                      className="rounded-[var(--r-md)] border border-border-subtle bg-elevated px-3.5 py-3"
                    >
                      <div className="mb-2 flex justify-between gap-3">
                        <p className="m-0 text-[13px] font-semibold text-foreground">
                          {action.id}
                        </p>
                        <Pill className={tone}>{action.status.replace("_", " ")}</Pill>
                      </div>
                      <p className="mb-2.5 mt-0 text-[13px] leading-[1.6] text-foreground-secondary">
                        {action.description}
                      </p>
                      <InfoGrid
                        rows={[
                          { label: "PIC", value: action.pic },
                          { label: "Target date", value: formatDate(action.targetDate) },
                        ]}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyStepState>No preventive actions have been added yet.</EmptyStepState>
            )}
          </Card>
        );
      case "verification":
        return (
          <Card>
            <CardLabel>Verification evidence</CardLabel>
            {capa.verification.result || capa.verification.evidenceFileNames.length > 0 ? (
              <div className="flex flex-col gap-3.5">
                <InfoGrid
                  rows={[
                    { label: "Method", value: capa.verification.method ?? "" },
                    { label: "Verified at", value: capa.verification.verifiedAt ? formatDateTime(capa.verification.verifiedAt) : "" },
                    { label: "Verified by", value: capa.verification.verifiedBy ?? "" },
                    { label: "Evidence files", value: capa.verification.evidenceFileNames.join(", ") },
                  ]}
                />
                {capa.verification.result && (
                  <p className="m-0 text-[13px] leading-[1.7] text-foreground-secondary">
                    {capa.verification.result}
                  </p>
                )}
              </div>
            ) : (
              <EmptyStepState>No verification result has been recorded yet.</EmptyStepState>
            )}
          </Card>
        );
      case "signoff":
        return (
          <Card>
            <CardLabel>Sign-off chain</CardLabel>
            {capa.approvals.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {capa.approvals.map((approval) => {
                  const tone = statusTone(approval.decision);
                  return (
                    <div
                      key={`${approval.approverPersonaId}-${approval.role}`}
                      className="rounded-[var(--r-md)] border border-border-subtle bg-elevated px-3.5 py-3"
                    >
                      <div className="mb-2 flex justify-between gap-3">
                        <div>
                          <p className="m-0 text-[13px] font-semibold text-foreground">
                            {approval.approverName}
                          </p>
                          <p className="mt-[3px] text-xs text-foreground-tertiary">
                            {approval.role}
                          </p>
                        </div>
                        <Pill className={tone}>{approval.decision}</Pill>
                      </div>
                      {approval.notes && (
                        <p className="mb-2 mt-0 text-[13px] leading-[1.6] text-foreground-secondary">
                          {approval.notes}
                        </p>
                      )}
                      {approval.signedAt && (
                        <p className="m-0 font-sans text-[11px] text-foreground-tertiary">
                          {formatDateTime(approval.signedAt)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyStepState>No sign-off activity has been recorded yet.</EmptyStepState>
            )}
          </Card>
        );
    }
  };

  return (
    <div key={step} className="motion-tab-content flex min-w-0 flex-1 flex-col gap-4">
      <p className="m-0 font-sans text-xs text-foreground-tertiary">
        <button
          type="button"
          onClick={onBackToOverview}
          className="cursor-pointer border-0 bg-transparent p-0 font-inherit text-foreground-faint hover:text-foreground-secondary"
        >
          CAPA Overview
        </button>
        {" / "}
        <span className="text-foreground-secondary">{STEP_LABELS[step]}</span>
      </p>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="mb-1.5 mt-0 text-2xl font-semibold tracking-[-0.02em] text-foreground"
          >
            {STEP_LABELS[step]}
          </h1>
          <p className="m-0 text-[13px] leading-[1.6] text-foreground-secondary">
            Inline 8D workspace for {capa.id}. The URL stays on the CAPA hub while this panel changes context.
          </p>
        </div>
        <Pill className={stepTone}>
          {stepState}
        </Pill>
      </div>

      {renderStepBody()}

      <Card surface="elevated" accent>
        <CardLabel>Nova context</CardLabel>
        <p className="m-0 text-[13px] leading-[1.7] text-foreground-secondary">
          {capa.impact.rationale}
        </p>
      </Card>
    </div>
  );
}

function EditableStepWorkspace({
  step,
  onStepChange,
  onBackToOverview,
}: {
  step: EightDStep;
  onStepChange: (step: EightDStep) => void;
  onBackToOverview: () => void;
}) {
  const StepComponent = EMBEDDED_STEP_COMPONENTS[step];

  return (
    <div key={step} className="motion-tab-content flex min-w-0 flex-1 flex-col gap-4">
      <p className="m-0 font-sans text-xs text-foreground-tertiary">
        <button
          type="button"
          onClick={onBackToOverview}
          className="cursor-pointer border-0 bg-transparent p-0 font-inherit text-foreground-faint hover:text-foreground-secondary"
        >
          CAPA Overview
        </button>
        {" / "}
        <span className="text-foreground-secondary">{STEP_LABELS[step]}</span>
      </p>

      <EightDEmbedProvider onStepChange={onStepChange}>
        <StepComponent />
      </EightDEmbedProvider>
    </div>
  );
}

/** Status banner shown on the overview while a CAPA is held in the intake gate. */
function IntakeStatusBanner({ capa }: { capa: CAPACase }) {
  const activePersonaId = usePersonaStore((s) => s.activePersonaId);
  const myReview = capa.intakeReviews?.find((r) => r.reviewerPersonaId === activePersonaId);
  const editIntakeUrl = `/capa/new?type=${capa.type}&sourceId=${capa.findingId}`;

  if (capa.status === "pending_review") {
    const isReviewer = Boolean(myReview);
    const reviewerActed = Boolean(myReview?.decision);
    const title = !isReviewer
      ? "Submitted — awaiting intake review"
      : reviewerActed
        ? "Your decision is recorded — awaiting the second reviewer"
        : "Action needed: record your intake decision";
    const body = !isReviewer
      ? "This CAPA is locked until Siti Rahmawati (QA) and Bambang Saputra (Department Head) both approve the intake. The 8D investigation can't start yet."
      : reviewerActed
        ? "Thanks — once the other reviewer also continues, Andi can begin the 8D investigation."
        : "Review the intake submission and reviewer panel, then choose Continue to CAPA, Send for Re-work, or Reject in the Intake Review card above.";
    return (
      <div className="rounded-[var(--r-md)] border-l-[3px] border-l-warning bg-[var(--warning-soft)] px-5 py-4">
        <p className="mb-1 mt-0 font-sans text-[13px] font-semibold text-warning">{title}</p>
        <p className="m-0 font-sans text-[13px] leading-[1.6] text-foreground-secondary">{body}</p>
      </div>
    );
  }

  if (capa.status === "revision_requested") {
    return (
      <div className="rounded-[var(--r-md)] border-l-[3px] border-l-warning bg-[var(--warning-soft)] px-5 py-4">
        <p className="mb-1 mt-0 font-sans text-[13px] font-semibold text-warning">Re-work requested</p>
        <p className="m-0 mb-3 font-sans text-[13px] leading-[1.6] text-foreground-secondary">
          A reviewer asked for changes to the gate questions or impact classification. Read their notes in the Intake Review card, then revise and resubmit.
        </p>
        {activePersonaId === "initiator" && (
          <Link
            to={editIntakeUrl}
            className="inline-flex items-center gap-2 rounded-[var(--r-sm)] border-0 bg-[image:var(--grad-brand)] px-4 py-2 font-sans text-[13px] font-semibold text-primary-foreground no-underline"
          >
            Revise &amp; resubmit intake
            <ArrowRight size={14} />
          </Link>
        )}
      </div>
    );
  }

  // rejected
  return (
    <div className="rounded-[var(--r-md)] border-l-[3px] border-l-destructive bg-[var(--danger-soft)] px-5 py-4">
      <p className="mb-1 mt-0 font-sans text-[13px] font-semibold text-destructive">Rejected at intake review</p>
      <p className="m-0 font-sans text-[13px] leading-[1.6] text-foreground-secondary">
        A reviewer decided this finding does not warrant a full CAPA. See their notes in the Intake Review card. No 8D investigation will proceed.
      </p>
    </div>
  );
}

/* ── Per-CAPA audit trail modal ──────────────────────────────────── */

const AUDIT_DOMAIN_CLASSES: Record<AuditDomain, string> = {
  system: "border-[var(--accent-line)] bg-[var(--accent-soft)] text-primary",
  ai_decision: "border-[var(--accent-line)] bg-[var(--accent-soft)] text-primary",
  integration: "border-success/40 bg-[var(--success-soft)] text-success",
  clear_labeling: "border-success/40 bg-[var(--success-soft)] text-success",
};

const AUDIT_DOMAIN_LABELS: Record<AuditDomain, string> = {
  system: "System",
  ai_decision: "AI Decision",
  integration: "Integration",
  clear_labeling: "Clear Labeling",
};

function formatAuditEventType(eventType: AuditEventType): string {
  return eventType
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function AuditTrailEventRow({ evt, isLast }: { evt: AuditEvent; isLast: boolean }) {
  return (
    <li className="relative flex gap-3">
      {/* timeline rail */}
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
            AUDIT_DOMAIN_CLASSES[evt.domain],
          )}
        >
          <CircleDot size={12} strokeWidth={2} aria-hidden="true" />
        </span>
        {!isLast && <span className="mt-1 w-px flex-1 bg-[var(--line-2)]" aria-hidden="true" />}
      </div>

      {/* event body */}
      <div className="min-w-0 flex-1 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-block whitespace-nowrap rounded-[20px] border px-2 py-[2px] font-sans text-[10px] font-semibold",
              AUDIT_DOMAIN_CLASSES[evt.domain],
            )}
          >
            {AUDIT_DOMAIN_LABELS[evt.domain]}
          </span>
          <span className="font-sans text-[11px] font-medium text-foreground-secondary">
            {formatAuditEventType(evt.eventType)}
          </span>
          <time
            dateTime={evt.timestamp}
            className="ml-auto font-sans text-[11px] text-foreground-tertiary"
          >
            {formatDateTime(evt.timestamp)}
          </time>
        </div>

        <p className="mb-0 mt-1 font-sans text-[13px] leading-[1.5] text-foreground-secondary">
          {evt.action}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 font-sans text-[11px] text-foreground-tertiary">
          <span className="font-semibold text-foreground-secondary">{evt.actorName}</span>
          <span aria-hidden="true">·</span>
          <span>{evt.actorRole}</span>
          <span className="text-foreground-faint">· {evt.id}</span>
        </div>

        {(evt.before || evt.after) && (
          <div className="mt-2 flex flex-col gap-1">
            {evt.before && (
              <div className="rounded-md bg-field px-2 py-1.5 text-[11px] leading-[1.4] text-foreground-tertiary">
                <span className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">
                  Before
                </span>
                <div className="mt-0.5">{evt.before}</div>
              </div>
            )}
            {evt.after && (
              <div className="rounded-md bg-field px-2 py-1.5 text-[11px] leading-[1.4] text-foreground-secondary">
                <span className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">
                  After
                </span>
                <div className="mt-0.5">{evt.after}</div>
              </div>
            )}
          </div>
        )}

        {evt.novaMetadata && (
          <div className="mt-2 inline-flex flex-wrap items-center gap-x-2 rounded-[var(--r-sm)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-2.5 py-1.5 text-[11px]">
            <Sparkles size={11} strokeWidth={2} className="text-primary" aria-hidden="true" />
            <span className="font-semibold text-primary">{evt.novaMetadata.modelName}</span>
            <span className="text-foreground-tertiary">{evt.novaMetadata.modelVersion}</span>
            <span className="text-foreground-secondary">Confidence {evt.novaMetadata.confidenceScore}%</span>
          </div>
        )}
      </div>
    </li>
  );
}

function CapaAuditTrailDialog({
  capaId,
  open,
  onOpenChange,
}: {
  capaId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const allEvents = useAuditTrailStore((s) => s.events);
  const events = useMemo(
    () =>
      allEvents
        .filter((e) => e.capaId === capaId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [allEvents, capaId],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b border-[var(--line-2)] px-6 py-4 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ScrollText size={16} strokeWidth={1.75} className="text-primary" aria-hidden="true" />
            Audit trail — {capaId}
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            {events.length > 0
              ? `${events.length} logged ${events.length === 1 ? "event" : "events"} for this CAPA · read-only, ALCOA+ compliant.`
              : "Read-only event log for this CAPA · ALCOA+ compliant."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {events.length === 0 ? (
            <p className="m-0 py-6 text-center font-sans text-sm text-foreground-tertiary">
              No audit events have been recorded for this CAPA yet.
            </p>
          ) : (
            <ol className="m-0 list-none p-0">
              {events.map((evt, i) => (
                <AuditTrailEventRow key={evt.id} evt={evt} isLast={i === events.length - 1} />
              ))}
            </ol>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MiddleColumn({
  capa,
  selectedStep,
  onSelectStep,
  onBackToOverview,
}: {
  capa: CAPACase;
  selectedStep: EightDStep | null;
  onSelectStep: (step: EightDStep) => void;
  onBackToOverview: () => void;
}) {
  const activePersonaId = usePersonaStore((s) => s.activePersonaId);
  const canEdit = canFillCAPA(activePersonaId);
  const [auditOpen, setAuditOpen] = useState(false);

  if (selectedStep && !isIntakeBlocked(capa.status)) {
    // Closed cases are read-only for everyone; for open cases, only the
    // initiator gets the editable workspace — other personas view it read-only.
    if (capa.status === "closed" || !canEdit) {
      return <StepDetailView capa={capa} step={selectedStep} onBackToOverview={onBackToOverview} />;
    }

    return (
      <EditableStepWorkspace
        step={selectedStep}
        onStepChange={onSelectStep}
        onBackToOverview={onBackToOverview}
      />
    );
  }

  const source = getSourceSystem(capa.preFill);
  const severityColors: Record<string, string> = {
    Ungraded: "bg-field text-foreground-tertiary",
    Critical: "bg-[var(--danger-soft)] text-destructive",
    Major: "bg-[var(--danger-soft)] text-destructive",
    Minor: "bg-[var(--warning-soft)] text-warning",
  };
  const sev = severityColors[capa.impact.severity] ?? "bg-elevated text-foreground-secondary";

  const statusColors: Record<string, string> = {
    investigation: "bg-[var(--accent-soft)] text-primary",
    approval: "bg-[var(--warning-soft)] text-warning",
    closed: "bg-[var(--success-soft)] text-success",
    draft: "bg-field text-foreground-tertiary",
    pending_review: "bg-[var(--warning-soft)] text-warning",
    revision_requested: "bg-[var(--warning-soft)] text-warning",
    rejected: "bg-[var(--danger-soft)] text-destructive",
  };
  const st = statusColors[capa.status] ?? "bg-elevated text-foreground-secondary";
  const statusLabel: Record<string, string> = {
    investigation: "In progress",
    approval: "Pending approval",
    closed: "Closed",
    draft: "Draft",
    pending_review: "Pending review",
    revision_requested: "Revision requested",
    rejected: "Rejected",
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">



      {/* Title */}
      <div className="flex flex-row w-full justify-between items-end">
        <div className="flex flex-col gap-0">

          <div className="flex flex-row gap-4">
   <h1
          className="font-sans text-[22px] font-semibold tracking-[-0.018em] text-foreground"
        >
          {capa.id}
        </h1>

                  {/* Badge row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Pill>{source}</Pill>
        <Pill>{formatCAPAType(capa.type)}</Pill>
        <Pill className={sev}>
          {capa.impact.severity}
        </Pill>
        <Pill className={st}>
          {statusLabel[capa.status] ?? capa.status}
        </Pill>
      </div>
          </div>
     
        <p
          className="font-sans text-sm leading-[1.6] text-foreground-secondary"
        >
          {capa.title}
        </p>
        
</div>
              <div
        className="mb-6 flex justify-end gap-2"
      >
        <button
          onClick={() =>
            toast.info("Export PDF", { description: "PDF export is mocked in this demo." })
          }
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-transparent px-3.5 py-[7px] font-sans text-[13px] font-medium text-foreground-secondary transition-[background,color] duration-200 hover:bg-elevated hover:text-foreground"
        >
          <Download size={14} strokeWidth={1.75} />
          Export PDF
        </button>
        <button
          type="button"
          onClick={() => setAuditOpen(true)}
          aria-haspopup="dialog"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-transparent px-3.5 py-[7px] font-sans text-[13px] font-medium text-foreground-secondary transition-[background,color] duration-200 hover:bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
        >
          <ScrollText size={14} strokeWidth={1.75} />
          Audit trail
        </button>
      </div>

      <CapaAuditTrailDialog
        capaId={capa.id}
        open={auditOpen}
        onOpenChange={setAuditOpen}
      />

      </div>

      {/* Source data */}
      <SourceDataCard prefill={capa.preFill} />

      {/* Intake submission (initiator's gate answers + severity) — shown on any
          CAPA that captured intake answers so reviewers and downstream owners
          can read what was submitted. Self-gates to null when empty. */}
      {capa.gateAnswers.length > 0 && <IntakeSubmissionCard capa={capa} />}

      {/* Intake review decisions — only while the case carries reviewer slots */}
      {capa.intakeReviews && capa.intakeReviews.length > 0 && (
        <IntakeReviewCard capa={capa} />
      )}

      {/* Nova Summary */}
      <NovaSummaryCard capa={capa} />

      {/* CTA — gated behind intake review, then behind initiator-only editing */}
      {isIntakeBlocked(capa.status) ? (
        <div className="pb-8">
          <IntakeStatusBanner capa={capa} />
        </div>
      ) : (
        <div className="flex items-center justify-end gap-3 pb-8">
          {!canEdit && (
            <p className="m-0 font-sans text-xs text-foreground-tertiary">
              Only the initiator can fill in this CAPA.
            </p>
          )}
          <button
            type="button"
            onClick={() => onSelectStep(capa.currentStep)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--r-sm)] border-0 bg-[image:var(--grad-brand)] px-5 py-2.5 font-sans text-sm font-semibold text-primary-foreground"
          >
            {canEdit ? getCtaLabel(capa.currentStep) : `View ${STEP_SHORT[capa.currentStep]}`}
            <ArrowRight size={16} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}

function RightColumn({
  capa,
 
}: {
  capa: CAPACase;

}) {
  const personas = usePersonaStore((s) => s.personas);
  const pic = personas.find((p) => p.id === capa.assignedTo);
  const scoreTips = getScoreLiftTips(capa.score);
  const scoreRows = [
    { label: "Problem", value: capa.score.problemSpecificity },
    { label: "RCA", value: capa.score.rootCauseDepth },
    { label: "Actions", value: capa.score.effectiveness },
    { label: "Containment", value: capa.score.containment },
  ];
  const dueRaw = MOCK_DUE[capa.id];
  const dueStr = dueRaw
    ? new Date(dueRaw).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";
  const isDue = dueRaw ? new Date(dueRaw) < new Date("2026-05-31") : false;
  const sourceId = capa.preFill.source === "Q100+"
    ? (capa.preFill as any).findingId ?? capa.findingId
    : (capa.preFill as any).deviationId ?? (capa.preFill as any).complaintId ?? capa.findingId;

  return (
    <div
      className="sticky top-[72px] flex h-[calc(100vh-96px)] w-[220px] shrink-0 flex-col gap-5 overflow-y-auto pr-1"
    >

      {/* CAPA Info */}
      <div>
        <EyebrowLeft>CAPA Info</EyebrowLeft>
        <div
          className="flex flex-col gap-2.5 rounded-[var(--r-md)] border border-[var(--line-2)] bg-card p-3 shadow-sm"
        >
          {[
            { label: "PIC", value: pic?.displayName ?? capa.assignedTo ?? "—" },
            { label: "Dept", value: capa.department },
            {
              label: "Due date",
              value: dueStr,
              isDanger: isDue,
            },
            { label: "Source", value: sourceId },
          ].map(({ label, value, isDanger }) => (
            <div key={label}>
              <p
                className="mb-0.5 mt-0 font-sans text-[9px] uppercase tracking-[0.18em] text-foreground-secondary font-bold"
              >
                {label}
              </p>
              <p
                className={cn(
                  "m-0 break-words font-sans text-xs [overflow-wrap:anywhere] font-bold!",
                  isDanger ? "font-semibold text-destructive" : "font-normal text-foreground-secondary",
                )}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quality Score */}
      <div>
        <EyebrowLeft>Quality Score</EyebrowLeft>
        <div
          id="score"
          className="rounded-[var(--r-md)] border border-[var(--line-2)] bg-card px-3 py-3.5 shadow-sm"
        >
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={cn(
                "m-0 font-sans text-[44px] font-semibold leading-none tracking-[-0.03em] tabular-nums",
                capa.score.total >= 80
                  ? "text-success"
                  : capa.score.total >= 60
                    ? "text-warning"
                    : "text-destructive",
              )}
            >
              {capa.score.total}
            </p>
            <span
              className={cn(
                "whitespace-nowrap rounded-[var(--r-full)] px-[7px] py-0.5 font-sans text-[10px]",
                capa.score.isAuditReady
                  ? "bg-[var(--success-soft)] text-success"
                  : "bg-[var(--warning-soft)] text-warning",
              )}
            >
              {capa.score.isAuditReady ? "Audit ready" : "Needs lift"}
            </span>
          </div>
          <p
            className="mb-3 mt-1.5 font-sans text-[10px] uppercase tracking-[0.18em] text-foreground-tertiary"
          >
            Total / 100
          </p>

          <div className="flex flex-col gap-2.5">
            {scoreRows.map((row) => {
              const pct = (row.value / 25) * 100;
              const colorClass =
                row.value >= 20
                  ? "bg-success"
                  : row.value >= 15
                    ? "bg-warning"
                    : "bg-destructive";
              return (
                <div key={row.label}>
                  <div className="mb-1 flex justify-between gap-2">
                    <span className="text-[11px] font-semibold text-foreground-secondary">{row.label}</span>
                    <span className="font-sans text-[11px] text-foreground-tertiary">
                      {row.value}/25
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-[var(--r-full)] bg-field"
                  >
                    <div
                      className={cn("h-full rounded-[var(--r-full)] transition-[width] [transition-duration:var(--dur-tab)] [transition-timing-function:var(--ease-out)]", colorClass)}
                      style={{
                        width: `${pct}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {scoreTips.length > 0 && (
            <div
              className="mt-3 flex flex-col gap-2 border-t border-border-subtle pt-3"
            >
              <p
                className="m-0 font-sans text-[9px] uppercase tracking-[0.18em] text-foreground-tertiary"
              >
                Lift tips
              </p>
              {scoreTips.map((tip) => (
                <div
                  key={`${tip.field}-${tip.subScore}`}
                  className="rounded-[var(--r-sm)] border border-border-subtle bg-elevated px-[9px] py-2"
                >
                  <p className="mb-[3px] mt-0 text-[11px] font-semibold text-foreground-secondary">
                    {tip.field} +{tip.scoreGain}
                  </p>
                  <p className="m-0 text-[11px] leading-6 text-foreground-tertiary">
                    {tip.suggestion}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   PAGE ROOT
   ════════════════════════════════════════════════════════════════════ */

export function CapaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedStep, setSelectedStep] = useState<EightDStep | null>(null);
  const rawCapa = useCapaStore((s) => s.capas.find((c) => c.id === id));
  const allCAs = useCapaStore((s) => s.correctiveActions);
  const allPAs = useCapaStore((s) => s.preventiveActions);

  const capa = useMemo(() => {
    if (!rawCapa) return undefined;
    return {
      ...rawCapa,
      correctiveActions: allCAs.filter((a) => a.capaId === rawCapa.id),
      preventiveActions: allPAs.filter((a) => a.capaId === rawCapa.id),
    };
  }, [rawCapa, allCAs, allPAs]);

  if (!capa) {
    return <NotFound message={`CAPA ${id ?? ""} is not available in the demo dataset.`} />;
  }

  return (
    <div className="font-sans">
      {/* ── Top action bar ────────────────────────────────────── */}

      {/* ── Three-column layout ─────────────────────────────────── */}
      <div className="flex items-start gap-7">
        <LeftColumn
          capa={capa}
          selectedStep={selectedStep}
          onSelectStep={setSelectedStep}
          onOverview={() => setSelectedStep(null)}
        />
        <MiddleColumn
          capa={capa}
          selectedStep={selectedStep}
          onSelectStep={setSelectedStep}
          onBackToOverview={() => setSelectedStep(null)}
        />
        <RightColumn 
          capa={capa}
/>

      </div>
    </div>
  );
}
