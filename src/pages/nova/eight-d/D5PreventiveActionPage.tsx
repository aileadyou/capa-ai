import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Circle, ListPlus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EightDShell, useEightDEmbed } from "@/components/layout/EightDShell";
import { ApprovalChainPanel } from "@/components/capa/ApprovalChainPanel";
import { NovaSuggestionBlock } from "@/components/nova/NovaSuggestionBlock";
import { NovaAssistPanel } from "@/components/nova/NovaAssistPanel";
import NotFound from "@/pages/NotFound";
import {
  useAddPreventiveAction,
  useAiSuggestion,
  useCapa,
  useRemovePreventiveAction,
  useUpdateScore,
  useUpdateStep,
} from "@/hooks/api";
import type { PreventiveAction } from "@/types";
import { getCycleAtSeam, isCycleComplete } from "@/config/workflows";
import { cn } from "@/lib/utils";
import { computeActionEffectiveness, computeTotalQualityScore } from "@/utils/scoring";
import { formatDate } from "@/utils/formatters";

// ── Mock suggestion data ─────────────────────────────────────────────────────

const paSuggestions: Record<string, string> = {
  "CAPA-2026-0341":
    "Revise SOP PM-HEPA-001 to require 12-month HEPA filter replacement for Grade A filling areas and add automated maintenance reminders 60 days before due date.",
  "CAPA-2026-0089":
    "Revise the material transfer SOP to require same-time second-person verification, add an end-of-shift documentation checklist, and run weekly QA spot checks for three months.",
  "CAPA-2026-0112":
    "Update visual inspection reconciliation procedure to define escalation thresholds for reject variance, add QA reviewer checklist item, and retrain visual inspection reviewers and batch release QA personnel.",
};

const paReasoning: Record<string, string> = {
  "CAPA-2026-0341":
    "HEPA degradation recurrence risk is highest when replacement intervals are not enforced systemically. SOP revision with automated reminders closes the scheduling gap and prevents future drift.",
  "CAPA-2026-0089":
    "Late documentation recurrence stems from absent process controls. Second-person verification and end-of-shift checklists embed prevention at the point of execution, not after the fact.",
  "CAPA-2026-0112":
    "Visual reconciliation deviations recur when escalation thresholds are undefined. Formalising reject variance limits and requiring QA reviewer sign-off makes the system self-correcting.",
};

const picOptions = [
  { value: "Andi Wijaya", label: "Andi Wijaya · Initiator" },
  { value: "Siti Rahmawati", label: "Siti Rahmawati · QA Deviation" },
  { value: "Bambang Saputra", label: "Bambang Saputra · Department Head" },
  { value: "Dewi Anggraini", label: "Dewi Anggraini · Head of QA" },
  { value: "Dr. Ahmad Pratomo", label: "Dr. Ahmad Pratomo · SME" },
];

// ── Status badge (inline) ────────────────────────────────────────────────────

function ActionStatusBadge({ status }: { status: PreventiveAction["status"] }) {
  const map: Record<PreventiveAction["status"], { label: string; className: string }> = {
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

function getDefaultTargetDate() {
  const target = new Date();
  target.setDate(target.getDate() + 21);
  return target.toISOString().slice(0, 10);
}

function evaluatePreventiveAction(description: string, pic: string, targetDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = targetDate ? new Date(`${targetDate}T00:00:00`) : undefined;

  const checks = [
    {
      label: "Description is at least 30 characters",
      hint: "Provide a specific forward-looking action with enough detail to be actionable",
      passed: description.trim().length >= 30,
    },
    {
      label: "Prevention is forward-looking",
      hint: "Use keywords like revise, update, add, train, checklist, or escalation",
      passed: /\b(revise|update|add|trend|train|checklist|review|escalation|reminder|spot check)\b/i.test(description),
    },
    {
      label: "PIC selected",
      hint: "Assign an accountable person in charge",
      passed: pic.trim().length > 0,
    },
    {
      label: "Target date is in the future",
      hint: "Set a realistic completion deadline beyond today",
      passed: Boolean(target && target > today),
    },
  ];

  return { checks, isValid: checks.every((c) => c.passed) };
}

// ── Action list sub-component ────────────────────────────────────────────────

function ActionList({ actions, onRemove }: { actions: PreventiveAction[]; onRemove: (id: string) => void }) {
  if (actions.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card shadow-sm">
      <div className="border-b border-border-subtle bg-elevated px-4 py-3.5">
        <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Added Preventive Actions
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
                    <p className="mb-[3px] mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">PIC</p>
                    <p className="m-0 text-xs text-foreground-secondary">{action.pic}</p>
                  </div>
                  <div>
                    <p className="mb-[3px] mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Target Date</p>
                    <p className="m-0 text-xs text-foreground-secondary">{formatDate(action.targetDate)}</p>
                  </div>
                  <div>
                    <p className="mb-[3px] mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Nova Generated</p>
                    <p className="m-0 text-xs text-foreground-secondary">{action.novaGenerated ? "Yes" : "No"}</p>
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

export function D5PreventiveActionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { embedded, onStepChange, readOnly: isReadOnly } = useEightDEmbed();
  const { data: capa } = useCapa(id);

  const addPA = useAddPreventiveAction();
  const removePA = useRemovePreventiveAction();
  const updateScore = useUpdateScore();
  const updateStep = useUpdateStep();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [novaSuggestion, setNovaSuggestion] = useState("");
  const [novaReasoning, setNovaReasoning] = useState<string | undefined>();

  const { data: paAiResult } = useAiSuggestion<string[]>(
    "preventive_actions",
    { capaId: capa?.id, capaType: capa?.type, enabled: Boolean(capa?.id) },
  );

  // Blank to start — the owner describes the preventive action first; the Nova
  // draft is opt-in via the assist panel below the quality signals.
  const [description, setDescription] = useState("");
  const [pic, setPic] = useState("Siti Rahmawati");
  const [targetDate, setTargetDate] = useState(getDefaultTargetDate());

  useEffect(() => {
    if (!capa || !paAiResult) return;
    const firstSuggestion = paAiResult.data[0];
    setNovaSuggestion(firstSuggestion ?? paSuggestions[capa.id] ?? "");
    setNovaReasoning(
      firstSuggestion
        ? "Generated from the enriched finding packet as a forward-looking recurrence-control action."
        : paReasoning[capa.id],
    );
  }, [paAiResult, capa?.id]);

  if (!capa) {
    return <NotFound message={`CAPA ${id ?? ""} is not available in the demo dataset.`} />;
  }

  const paCycle = getCycleAtSeam(capa, "pa");
  const currentActions = capa.preventiveActions;
  const draftAction = {
    description,
    targetDate: `${targetDate}T17:00:00+07:00`,
  };
  const previewScore = computeTotalQualityScore({
    ...capa.score,
    effectiveness: computeActionEffectiveness(capa.correctiveActions, [...currentActions, draftAction]),
  });
  void previewScore;

  const validation = evaluatePreventiveAction(description, pic, targetDate);
  const validExistingActionExists = currentActions.some(
    (action) => action.description.length >= 30 && new Date(action.targetDate).getTime() > Date.now(),
  );
  const shouldShowBlocker = hasSubmitted && !validation.isValid;
  const passedCount = validation.checks.filter((c) => c.passed).length;

  const handleRemovePA = async (actionId: string) => {
    const remaining = currentActions.filter((a) => a.id !== actionId);
    const nextScore = computeTotalQualityScore({
      ...capa.score,
      effectiveness: computeActionEffectiveness(capa.correctiveActions, remaining),
    });
    try {
      await removePA.mutateAsync({ actionId });
      await updateScore.mutateAsync({ capaId: capa.id, score: nextScore });
      toast.info("Preventive action removed");
    } catch (error) {
      toast.error("Could not remove preventive action", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  // The server logs the `preventive_action_added` audit event inside addPA, so
  // the client only persists the action + recalculated score here.
  const addPreventiveAction = async () => {
    setHasSubmitted(true);

    if (!validation.isValid) {
      toast.error("Preventive action blocked", {
        description: "Complete a forward-looking description, PIC, and future target date.",
      });
      return undefined;
    }

    try {
      const newAction = await addPA.mutateAsync({
        capaId: capa.id,
        action: {
          description: description.trim(),
          pic,
          targetDate: `${targetDate}T17:00:00+07:00`,
          status: "open",
          novaGenerated: true,
          novaSuggestionStatus: "accepted",
        },
      });

      const nextActions = [...currentActions, newAction];
      const nextScore = computeTotalQualityScore({
        ...capa.score,
        effectiveness: computeActionEffectiveness(capa.correctiveActions, nextActions),
      });
      await updateScore.mutateAsync({ capaId: capa.id, score: nextScore });
      toast.success("Preventive action added", {
        description: `${newAction.id} is now tracked in CAPA detail.`,
      });

      return newAction;
    } catch (error) {
      toast.error("Could not add preventive action", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
      return undefined;
    }
  }

  const continueToVerification = async () => {
    setHasSubmitted(true);

    if (paCycle && !isCycleComplete(capa, paCycle.stage)) {
      toast.error(`${paCycle.title} required`, {
        description: "All approvers must sign off before proceeding to verification.",
      });
      return;
    }

    const hasValidAction = validExistingActionExists || validation.isValid;
    if (!hasValidAction) {
      toast.warning("Continuing without a complete preventive action", {
        description: "Nova will let you continue, but D5 still needs at least one preventive action with a future target date.",
      });
    } else if (!validExistingActionExists) {
      const added = await addPreventiveAction();
      if (!added) return;
    }

    try {
      await updateStep.mutateAsync({ capaId: capa.id, step: "verification" });
      if (embedded && onStepChange) {
        onStepChange("verification");
      } else {
        navigate(`/capa/${capa.id}/8d/verification`);
      }
    } catch (error) {
      toast.error("Could not continue to verification", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  return (
    <EightDShell capaId={capa.id} activeStep="pa">
      <div className="flex flex-col gap-6">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div>
          <p className="mb-1.5 mt-0 font-sans text-xs tracking-[0.18em] text-primary">
            {capa.id} · D5
          </p>
          <h1 className="mb-2 mt-0 font-sans text-[22px] font-bold text-foreground">
            Preventive Action
          </h1>
          <p className="m-0 max-w-[600px] text-[13px] leading-[1.55] text-foreground-tertiary">
            Define preventive actions that reduce recurrence risk and strengthen the quality system beyond the immediate correction. Nova can draft one for you below if you'd like a hand.
          </p>
        </div>

        {/* ── Existing actions ──────────────────────────────────────────── */}
        <ActionList actions={currentActions} onRemove={handleRemovePA} />

        {/* ── Add PA form ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-[18px] rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-5">
          <div className="flex items-center gap-2">
            <ListPlus size={15} className="shrink-0 text-primary" />
            <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Add Preventive Action
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="pa-description" className="mb-2 block font-sans text-xs font-semibold tracking-[0.02em] text-foreground-secondary">
              Description
            </label>
            <textarea
              id="pa-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isReadOnly}
              rows={5}
              aria-invalid={shouldShowBlocker && description.trim().length < 30}
              className={cn(
                "box-border w-full resize-y rounded-[var(--r-sm)] border bg-[var(--field-bg)] px-3.5 py-3 font-sans text-[13px] leading-[1.65] text-foreground outline-none transition-[border-color,box-shadow] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)] disabled:cursor-not-allowed disabled:resize-none disabled:opacity-50",
                shouldShowBlocker && description.trim().length < 30 ? "border-destructive" : "border-[var(--line-2)]",
              )}
            />
          </div>

          {/* PIC + Target date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pa-pic" className="mb-2 block font-sans text-xs font-semibold tracking-[0.02em] text-foreground-secondary">
                Person in Charge
              </label>
              <div className="relative">
                <select
                  id="pa-pic"
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
              <label htmlFor="pa-target-date" className="mb-2 block font-sans text-xs font-semibold tracking-[0.02em] text-foreground-secondary">
                Target date
              </label>
              <input
                id="pa-target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                aria-invalid={shouldShowBlocker && !new Date(`${targetDate}T00:00:00`).getTime()}
                className={cn(
                  "box-border w-full rounded-[var(--r-sm)] border bg-[var(--field-bg)] px-3 py-[9px] font-sans text-[13px] text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]",
                  shouldShowBlocker && !new Date(`${targetDate}T00:00:00`).getTime() ? "border-destructive" : "border-[var(--line-2)]",
                )}
              />
            </div>
          </div>
        </div>

        {/* ── Blocker banner ───────────────────────────────────────────── */}
        {shouldShowBlocker && (
          <div role="alert" className="flex gap-2.5 rounded-[var(--r-sm)] border border-destructive/40 bg-[var(--danger-soft)] px-3.5 py-3">
            <AlertTriangle size={15} className="mt-px shrink-0 text-destructive" />
            <div>
              <p className="mb-0.5 mt-0 font-sans text-[13px] font-semibold text-destructive">Preventive action is incomplete</p>
              <p className="m-0 font-sans text-xs text-foreground-tertiary">
                Each PA needs a forward-looking description, PIC, and target date in the future before continuing.
              </p>
            </div>
          </div>
        )}

        {/* ── Quality signals ──────────────────────────────────────────── */}
        <div>
          <p className="mb-2.5 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
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
          <p className={cn("mt-2 font-sans text-[11px]", passedCount === 4 ? "text-primary" : "text-foreground-faint")}>
            {passedCount}/4 checks passing
          </p>
        </div>

        {/* ── Nova assist (opt-in, below the user's own work) ──────────── */}
        <NovaAssistPanel
          title="Stuck? Let Nova draft a preventive action"
          description="Describe the forward-looking safeguard your way. Nova's draft is here if you'd like a starting point for the SOP, checklist, or training change."
        >
          <NovaSuggestionBlock
            context="preventive action"
            suggestion={novaSuggestion || paSuggestions[capa.id] || ""}
            reasoning={novaReasoning ?? paReasoning[capa.id]}
            capaId={capa.id}
            suggestionId="d5-pa"
            onAccept={(content) => setDescription(content)}
          />
        </NovaAssistPanel>

        {/* ── Footer actions ───────────────────────────────────────────── */}
        {!isReadOnly && (
          <div className="flex items-center justify-end gap-2.5 border-t border-border-subtle pt-2">
            <button
              onClick={addPreventiveAction}
              className="flex cursor-pointer items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-4 py-2 font-sans text-[13px] font-medium text-foreground-secondary"
            >
              <Save size={14} />
              Add PA
            </button>
            <button
              onClick={continueToVerification}
              className="cursor-pointer rounded-[var(--r-sm)] border-0 bg-[image:var(--grad-brand)] px-5 py-2 font-sans text-[13px] font-semibold tracking-[0.01em] text-primary-foreground"
            >
              Continue to D6 Verification →
            </button>
          </div>
        )}

        {/* ── Workflow approval cycle attached at this seam ─────────────── */}
        {paCycle && <ApprovalChainPanel capa={capa} stage={paCycle.stage} />}

      </div>
    </EightDShell>
  );
}
