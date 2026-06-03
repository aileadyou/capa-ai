import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Circle, ListPlus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EightDShell, useEightDEmbed } from "@/components/layout/EightDShell";
import { NovaSuggestionBlock } from "@/components/nova/NovaSuggestionBlock";
import { NovaAssistPanel } from "@/components/nova/NovaAssistPanel";
import NotFound from "@/pages/NotFound";
import { useAuditTrailStore, useCapaStore } from "@/store";
import type { CorrectiveAction } from "@/types";
import { cn } from "@/lib/utils";
import { computeActionEffectiveness, computeTotalQualityScore } from "@/utils/scoring";
import { formatDate } from "@/utils/formatters";
import { getCorrectiveActionSuggestions } from "@/services/novaService";

// ── Mock suggestion data ─────────────────────────────────────────────────────

const caSuggestions: Record<string, string> = {
  "CAPA-2026-0341":
    "Replace HEPA-FILL-02 filter, perform airflow requalification for the filling suite, and complete QA review of affected batch VAX-2406-A17 before release decision.",
  "CAPA-2026-0089":
    "Perform QA review of affected records, document reconciliation outcome, correct records according to GMP documentation procedure, and retrain involved operators and supervisors on real-time documentation requirements.",
  "CAPA-2026-0112":
    "Review complaint sample evidence, inspect retained samples from lot VX-2405-22, perform batch record review, assess final visual inspection reconciliation, and document QA batch impact assessment.",
};

const caReasoning: Record<string, string> = {
  "CAPA-2026-0341":
    "Root cause confirmed as HEPA filter degradation in Fill Suite FILL-02. Filter replacement and airflow requalification directly eliminates the confirmed root cause. QA batch review required before VAX-2406-A17 can be released.",
  "CAPA-2026-0089":
    "Root cause is late record completion and missing second-person verification. Corrective action must address the specific affected records, provide reconciliation, and retrain the implicated roles.",
  "CAPA-2026-0112":
    "Complaint for lot VX-2405-22 requires sample evidence review and batch record investigation. QA impact assessment documents whether a market action is warranted.",
};

const picOptions = [
  { value: "Andi Wijaya", label: "Andi Wijaya · Initiator" },
  { value: "Siti Rahmawati", label: "Siti Rahmawati · QA Deviation" },
  { value: "Bambang Saputra", label: "Bambang Saputra · Department Head" },
  { value: "Dewi Anggraini", label: "Dewi Anggraini · Head of QA" },
  { value: "Dr. Ahmad Pratomo", label: "Dr. Ahmad Pratomo · SME" },
];

// ── Status badge (inline) ────────────────────────────────────────────────────

function ActionStatusBadge({ status }: { status: CorrectiveAction["status"] }) {
  const map: Record<CorrectiveAction["status"], { label: string; className: string }> = {
    open: { label: "Open", className: "border-border-subtle bg-elevated text-foreground-tertiary" },
    in_progress: { label: "In Progress", className: "border-warning/30 bg-[var(--warning-soft)] text-warning" },
    completed: { label: "Completed", className: "border-success/30 bg-[var(--success-soft)] text-success" },
    overdue: { label: "Overdue", className: "border-destructive/30 bg-[var(--danger-soft)] text-destructive" },
    verified: { label: "Verified", className: "border-[var(--accent-line)] bg-[var(--accent-soft)] text-primary" },
  };
  const s = map[status] ?? map.open;
  return (
    <span
      className={cn("whitespace-nowrap rounded-[var(--r-full)] border px-2 py-0.5 font-sans text-[11px] font-semibold", s.className)}
    >
      {s.label}
    </span>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDefaultDueDate() {
  const target = new Date();
  target.setDate(target.getDate() + 7);
  return target.toISOString().slice(0, 10);
}

function evaluateCorrectiveAction(
  description: string,
  pic: string,
  dueDate: string,
  linkedRootCause: string,
  verificationMethod: string,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = dueDate ? new Date(`${dueDate}T00:00:00`) : undefined;

  const checks = [
    {
      label: "Description is at least 30 characters",
      hint: "Provide a specific action with enough detail to be actionable",
      passed: description.trim().length >= 30,
    },
    {
      label: "PIC selected",
      hint: "Assign an accountable person in charge",
      passed: pic.trim().length > 0,
    },
    {
      label: "Due date is today or future",
      hint: "Set a realistic completion deadline",
      passed: Boolean(due && due >= today),
    },
    {
      label: "Linked to confirmed root cause",
      hint: "Reference the root cause this action directly addresses",
      passed: linkedRootCause.trim().length >= 20,
    },
    {
      label: "Verification method defined",
      hint: "Describe how QA will verify the action is effective",
      passed: verificationMethod.trim().length >= 10,
    },
  ];

  return { checks, isValid: checks.every((c) => c.passed) };
}

// ── Action list sub-component ────────────────────────────────────────────────

function ActionList({ actions, onRemove }: { actions: CorrectiveAction[]; onRemove: (id: string) => void }) {
  if (actions.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card shadow-sm">
      <div className="border-b border-border-subtle bg-elevated px-4 py-3.5">
        <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-faint">
          Added Corrective Actions
        </p>
      </div>
      <div className="flex flex-col">
        {actions.map((action, i) => (
          <div
            key={action.id}
            className={cn("px-4 py-3.5", i < actions.length - 1 && "border-b border-border-subtle")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="font-sans text-[11px] font-semibold text-primary">
                    {action.id}
                  </span>
                  <ActionStatusBadge status={action.status} />
                </div>
                <p className="mb-2.5 mt-0 text-[13px] leading-[1.55] text-foreground-secondary">
                  {action.description}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="mb-[3px] mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">PIC</p>
                    <p className="m-0 text-xs text-foreground-secondary">{action.pic}</p>
                  </div>
                  <div>
                    <p className="mb-[3px] mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">Due Date</p>
                    <p className="m-0 text-xs text-foreground-secondary">{formatDate(action.dueDate)}</p>
                  </div>
                  <div>
                    <p className="mb-[3px] mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">Verification</p>
                    <p className="m-0 text-xs text-foreground-secondary">{action.verificationMethod}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onRemove(action.id)}
                className="flex shrink-0 cursor-pointer items-center rounded-[var(--r-sm)] border-0 bg-transparent p-1 text-foreground-faint hover:text-destructive"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function D4CorrectiveActionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { embedded, onStepChange } = useEightDEmbed();
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

  const addCA = useCapaStore((state) => state.addCA);
  const removeCA = useCapaStore((state) => state.removeCA);
  const updateScore = useCapaStore((state) => state.updateScore);
  const updateCurrentStep = useCapaStore((state) => state.updateCurrentStep);
  const addAuditEvent = useAuditTrailStore((state) => state.addEvent);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [novaSuggestion, setNovaSuggestion] = useState("");
  const [novaReasoning, setNovaReasoning] = useState<string | undefined>();

  const confirmedRootCauses = useMemo(
    () => capa?.rca.confirmedRootCauses.filter(Boolean) ?? [],
    [capa],
  );

  // Blank to start — the owner describes the corrective action first; the Nova
  // draft is opt-in via the assist panel below the quality signals.
  const [description, setDescription] = useState("");
  const [pic, setPic] = useState("Siti Rahmawati");
  const [dueDate, setDueDate] = useState(getDefaultDueDate());
  const [linkedRootCause, setLinkedRootCause] = useState(confirmedRootCauses[0] ?? "");
  const [verificationMethod, setVerificationMethod] = useState(
    "QA review of implementation evidence and documented effectiveness check.",
  );

  useEffect(() => {
    if (!capa) return;
    let cancelled = false;

    void getCorrectiveActionSuggestions(capa.id).then((suggestions) => {
      if (cancelled) return;
      const firstSuggestion = suggestions[0];
      setNovaSuggestion(firstSuggestion ?? caSuggestions[capa.id] ?? "");
      setNovaReasoning(
        firstSuggestion
          ? "Generated from the enriched finding packet and linked to the confirmed or candidate root cause."
          : caReasoning[capa.id],
      );
    });

    return () => {
      cancelled = true;
    };
  }, [capa]);

  if (!capa) {
    return <NotFound message={`CAPA ${id ?? ""} is not available in the demo dataset.`} />;
  }

  const currentActions = capa.correctiveActions;
  const draftAction = { description, linkedRootCause, verificationMethod };
  const previewScore = computeTotalQualityScore({
    ...capa.score,
    effectiveness: computeActionEffectiveness([...currentActions, draftAction], capa.preventiveActions),
  });
  const validation = evaluateCorrectiveAction(description, pic, dueDate, linkedRootCause, verificationMethod);
  const validExistingActionExists = currentActions.some(
    (a) => a.description.length >= 30 && a.linkedRootCause && a.verificationMethod,
  );
  const shouldShowBlocker = hasSubmitted && !validation.isValid;
  const passedCount = validation.checks.filter((c) => c.passed).length;

  function handleRemoveCA(actionId: string) {
    removeCA(actionId);
    const remaining = currentActions.filter((a) => a.id !== actionId);
    const nextScore = computeTotalQualityScore({
      ...capa.score,
      effectiveness: computeActionEffectiveness(remaining, capa.preventiveActions),
    });
    updateScore(capa.id, nextScore);
    toast.info("Corrective action removed");
  }

  function addCorrectiveAction() {
    setHasSubmitted(true);

    if (!validation.isValid) {
      toast.error("Corrective action blocked", {
        description: "Complete description, PIC, due date, linked root cause, and verification method.",
      });
      return undefined;
    }

    const newAction = addCA(capa.id, {
      description: description.trim(),
      pic,
      dueDate: `${dueDate}T17:00:00+07:00`,
      linkedRootCause,
      verificationMethod,
      status: "open",
      novaGenerated: true,
      novaSuggestionStatus: "accepted",
    });

    const nextScore = computeTotalQualityScore({
      ...capa.score,
      effectiveness: computeActionEffectiveness([...currentActions, newAction], capa.preventiveActions),
    });
    updateScore(capa.id, nextScore);
    addAuditEvent({
      actorName: "Nova Demo User",
      actorRole: "Initiator",
      domain: "system",
      eventType: "corrective_action_added",
      action: `Corrective action ${newAction.id} was added to ${capa.id}.`,
      capaId: capa.id,
      findingId: capa.findingId,
    });
    toast.success("Corrective action added", {
      description: `${newAction.id} is now tracked in CAPA detail.`,
    });

    return newAction;
  }

  function continueToPreventiveAction() {
    setHasSubmitted(true);

    const hasValidAction = validExistingActionExists || validation.isValid;
    if (!hasValidAction) {
      toast.warning("Continuing without a complete corrective action", {
        description: "Nova will let you continue, but D4 still needs at least one action linked to the confirmed root cause.",
      });
    } else if (!validExistingActionExists) {
      const added = addCorrectiveAction();
      if (!added) return;
    }

    updateCurrentStep(capa.id, "pa");
    if (embedded && onStepChange) {
      onStepChange("pa");
    } else {
      navigate(`/capa/${capa.id}/8d/pa`);
    }
  }

  return (
    <EightDShell capaId={capa.id} activeStep="ca">
      <div className="flex flex-col gap-6">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div>
          <p className="mb-1.5 mt-0 font-sans text-xs tracking-[0.18em] text-foreground-tertiary">
            {capa.id} · D4
          </p>
          <h1 className="mb-2 mt-0 font-sans text-[22px] font-bold text-foreground">
            Corrective Action
          </h1>
          <p className="m-0 max-w-[600px] text-[13px] leading-[1.55] text-foreground-tertiary">
            Define corrective actions that address the confirmed root cause, assign ownership, and specify how effectiveness will be verified. Nova can draft one for you below if you'd like a hand.
          </p>
        </div>

        {/* ── Existing actions ──────────────────────────────────────────── */}
        <ActionList actions={currentActions} onRemove={handleRemoveCA} />

        {/* ── Add CA form ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-[18px] rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-5">
          <div className="flex items-center gap-2">
            <ListPlus size={15} className="shrink-0 text-primary" />
            <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">
              Add Corrective Action
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="ca-description" className="mb-2 block font-sans text-xs font-semibold tracking-[0.02em] text-foreground-secondary">
              Description
            </label>
            <textarea
              id="ca-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              aria-invalid={shouldShowBlocker && description.trim().length < 30}
              className={cn(
                "box-border w-full resize-y rounded-[var(--r-sm)] border bg-[var(--field-bg)] px-3.5 py-3 font-sans text-[13px] leading-[1.65] text-foreground outline-none transition-[border-color,box-shadow] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]",
                shouldShowBlocker && description.trim().length < 30 ? "border-destructive" : "border-[var(--line-2)]",
              )}
            />
          </div>

          {/* PIC + Due date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ca-pic" className="mb-2 block font-sans text-xs font-semibold tracking-[0.02em] text-foreground-secondary">
                Person in Charge
              </label>
              <div className="relative">
                <select
                  id="ca-pic"
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] py-[9px] pl-3 pr-9 font-sans text-[13px] text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]"
                >
                  {picOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <svg width="12" height="12" viewBox="0 0 12 12" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>
            <div>
              <label htmlFor="ca-due-date" className="mb-2 block font-sans text-xs font-semibold tracking-[0.02em] text-foreground-secondary">
                Due date
              </label>
              <input
                id="ca-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="box-border w-full rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-3 py-[9px] font-sans text-[13px] text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]"
              />
            </div>
          </div>

          {/* Linked root cause */}
          <div>
            <label htmlFor="ca-linked-rc" className="mb-2 block font-sans text-xs font-semibold tracking-[0.02em] text-foreground-secondary">
              Linked root cause
            </label>
            <div className="relative">
              <select
                id="ca-linked-rc"
                value={linkedRootCause}
                onChange={(e) => setLinkedRootCause(e.target.value)}
                aria-invalid={shouldShowBlocker && linkedRootCause.trim().length < 20}
                className={cn(
                  "w-full cursor-pointer appearance-none rounded-[var(--r-sm)] border bg-[var(--field-bg)] py-[9px] pl-3 pr-9 font-sans text-[13px] text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]",
                  shouldShowBlocker && linkedRootCause.trim().length < 20 ? "border-destructive" : "border-[var(--line-2)]",
                )}
              >
                {confirmedRootCauses.length === 0 && (
                  <option value="" disabled>Complete D3 Root Cause Analysis first</option>
                )}
                {confirmedRootCauses.map((rc) => <option key={rc} value={rc}>{rc}</option>)}
              </select>
              <svg width="12" height="12" viewBox="0 0 12 12" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>

          {/* Verification method */}
          <div>
            <label htmlFor="verification-method" className="mb-2 block font-sans text-xs font-semibold tracking-[0.02em] text-foreground-secondary">
              Verification method
            </label>
            <textarea
              id="verification-method"
              value={verificationMethod}
              onChange={(e) => setVerificationMethod(e.target.value)}
              rows={3}
              aria-invalid={shouldShowBlocker && verificationMethod.trim().length < 10}
              className={cn(
                "box-border w-full resize-y rounded-[var(--r-sm)] border bg-[var(--field-bg)] px-3.5 py-3 font-sans text-[13px] leading-[1.65] text-foreground outline-none transition-[border-color,box-shadow] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]",
                shouldShowBlocker && verificationMethod.trim().length < 10 ? "border-destructive" : "border-[var(--line-2)]",
              )}
            />
          </div>
        </div>

        {/* ── Blocker banner ───────────────────────────────────────────── */}
        {shouldShowBlocker && (
          <div role="alert" className="flex gap-2.5 rounded-[var(--r-sm)] border border-destructive/40 bg-[var(--danger-soft)] px-3.5 py-3">
            <AlertTriangle size={15} className="mt-px shrink-0 text-destructive" />
            <div>
              <p className="mb-0.5 mt-0 font-sans text-[13px] font-semibold text-destructive">Corrective action is incomplete</p>
              <p className="m-0 font-sans text-xs text-foreground-tertiary">
                Complete description, PIC, due date, linked root cause, and verification method.
              </p>
            </div>
          </div>
        )}

        {/* ── Quality checklist ────────────────────────────────────────── */}
        <div>
          <p className="mb-2.5 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">
            Quality Signals
          </p>
          <div className="grid grid-cols-2 gap-2">
            {validation.checks.map((check) => (
              <div
                key={check.label}
                className={cn(
                  "flex gap-2.5 rounded-[var(--r-sm)] border px-3 py-2.5",
                  check.passed ? "border-success/30 bg-[var(--success-soft)]" : "border-border-subtle bg-elevated",
                )}
              >
                {check.passed ? (
                  <CheckCircle2 size={14} className="mt-px shrink-0 text-success" />
                ) : (
                  <Circle size={14} className="mt-px shrink-0 text-foreground-faint" />
                )}
                <div className="min-w-0">
                  <p className={cn("mb-0.5 mt-0 font-sans text-xs", check.passed ? "font-medium text-foreground-secondary" : "font-normal text-foreground-tertiary")}>{check.label}</p>
                  {!check.passed && <p className="m-0 font-sans text-[11px] text-foreground-faint">{check.hint}</p>}
                </div>
              </div>
            ))}
          </div>
          <p className={cn("mt-2 font-sans text-[11px]", passedCount === 5 ? "text-primary" : "text-foreground-faint")}>
            {passedCount}/5 checks passing
          </p>
        </div>

        {/* ── Nova assist (opt-in, below the user's own work) ──────────── */}
        <NovaAssistPanel
          title="Stuck? Let Nova draft a corrective action"
          description="Describe the action that fixes the confirmed root cause your way. Nova's draft is here if you'd like a starting point."
        >
          <NovaSuggestionBlock
            context="corrective action"
            suggestion={novaSuggestion || caSuggestions[capa.id] || ""}
            reasoning={novaReasoning ?? caReasoning[capa.id]}
            capaId={capa.id}
            suggestionId="d4-ca"
            onAccept={(content) => setDescription(content)}
          />
        </NovaAssistPanel>

        {/* ── Footer actions ───────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2.5 border-t border-border-subtle pt-2">
          <button
            onClick={addCorrectiveAction}
            className="flex cursor-pointer items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-4 py-2 font-sans text-[13px] font-medium text-foreground-secondary"
          >
            <Save size={14} />
            Add CA
          </button>
          <button
            onClick={continueToPreventiveAction}
            className="cursor-pointer rounded-[var(--r-sm)] border-0 bg-[image:var(--grad-brand)] px-5 py-2 font-sans text-[13px] font-semibold tracking-[0.01em] text-primary-foreground"
          >
            Continue to D5 Preventive Action →
          </button>
        </div>

      </div>
    </EightDShell>
  );
}
