import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Circle, Save } from "lucide-react";
import { toast } from "sonner";
import { EightDShell, useEightDEmbed } from "@/components/layout/EightDShell";
import { NovaSuggestionBlock } from "@/components/nova/NovaSuggestionBlock";
import { NovaAssistPanel } from "@/components/nova/NovaAssistPanel";
import NotFound from "@/pages/NotFound";
import { useAuditTrailStore, useCapaStore, useNotificationStore } from "@/store";
import type { CAPACase } from "@/types";
import { cn } from "@/lib/utils";
import { computeContainmentStrength, computeTotalQualityScore } from "@/utils/scoring";
import { getContainmentSuggestion } from "@/services/novaService";

// ── Mock suggestion data ─────────────────────────────────────────────────────

const containmentSuggestions: Record<string, string> = {
  "CAPA-2026-0341":
    "Immediately pause filling operation, quarantine affected batch VAX-2406-A17, perform additional environmental monitoring, and notify QA Deviation for assessment before batch disposition.",
  "CAPA-2026-0089":
    "Immediately place the affected material transfer records under QA review, verify physical material reconciliation against inventory logs, and temporarily require supervisor review for all WH-02 transfer records until CAPA completion.",
  "CAPA-2026-0112":
    "Open QA complaint investigation, quarantine retained samples from lot VX-2405-22, review distribution status, and perform immediate retained sample visual inspection before determining whether additional market action is required.",
};

const containmentReasoning: Record<string, string> = {
  "CAPA-2026-0341":
    "Batch VAX-2406-A17 is at risk due to particle count excursion in Grade A Fill Suite. Immediate pause and hold prevents further contamination risk while investigation proceeds.",
  "CAPA-2026-0089":
    "Three incomplete transfer records in WH-02 indicate a systemic documentation gap. Placing records under QA review and requiring supervisor sign-off halts further data integrity exposure.",
  "CAPA-2026-0112":
    "A visible particulate complaint requires immediate retained sample inspection and quarantine. Distribution review ensures no additional market risk before investigation is complete.",
};

const picOptions = [
  { value: "Andi Wijaya", label: "Andi Wijaya · Initiator" },
  { value: "Siti Rahmawati", label: "Siti Rahmawati · QA Deviation" },
  { value: "Bambang Saputra", label: "Bambang Saputra · Department Head" },
  { value: "Dewi Anggraini", label: "Dewi Anggraini · Head of QA" },
  { value: "Dr. Ahmad Pratomo", label: "Dr. Ahmad Pratomo · SME" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDefaultDueDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

function getExistingContainment(capa: CAPACase) {
  const answer = capa.gateAnswers.find((entry) => entry.questionId === "containment")?.answer;
  if (!answer) return undefined;
  const [description, picLine, dueDateLine] = answer.split("\n");
  return {
    description,
    pic: picLine?.replace("PIC: ", "") ?? "",
    dueDate: dueDateLine?.replace("Due date: ", "").slice(0, 10) ?? getDefaultDueDate(),
  };
}

function evaluateContainment(description: string, pic: string, dueDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = dueDate ? new Date(`${dueDate}T00:00:00`) : undefined;

  const checks = [
    {
      label: "Action description is at least 30 characters",
      hint: "Describe the specific hold, quarantine, or restriction action",
      passed: description.trim().length >= 30,
    },
    {
      label: "Immediate containment language",
      hint: "Include terms like hold, quarantine, restrict, pause, review, or assessment",
      passed: /\b(hold|quarantine|restrict|pause|review|assessment|sample|investigation)\b/i.test(description),
    },
    {
      label: "PIC selected",
      hint: "Assign a person in charge for accountability",
      passed: pic.trim().length > 0,
    },
    {
      label: "Due date is today or future",
      hint: "Containment must be completed on a current or future date",
      passed: Boolean(due && due >= today),
    },
  ];

  return { checks, isValid: checks.every((c) => c.passed) };
}

// ── Component ────────────────────────────────────────────────────────────────

export function D2ContainmentPage() {
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

  const updateContainmentAction = useCapaStore((state) => state.updateContainmentAction);
  const updateCurrentStep = useCapaStore((state) => state.updateCurrentStep);
  const addAuditEvent = useAuditTrailStore((state) => state.addEvent);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Description starts from the user's own saved answer (or blank). PIC and due
  // date keep sensible scaffolding defaults. The Nova draft lives in the assist
  // panel below, so the user defines the action first.
  const initialContainment = useMemo(() => {
    if (!capa) return { description: "", pic: "", dueDate: getDefaultDueDate() };
    return {
      description: getExistingContainment(capa)?.description ?? "",
      pic: getExistingContainment(capa)?.pic ?? "Siti Rahmawati",
      dueDate: getExistingContainment(capa)?.dueDate ?? getDefaultDueDate(),
    };
  }, [capa]);

  const [description, setDescription] = useState(initialContainment.description);
  const [pic, setPic] = useState(initialContainment.pic);
  const [dueDate, setDueDate] = useState(initialContainment.dueDate);
  const [novaSuggestion, setNovaSuggestion] = useState("");
  const [novaReasoning, setNovaReasoning] = useState<string | undefined>();

  useEffect(() => {
    if (!capa) return;
    let cancelled = false;

    void getContainmentSuggestion(capa.id).then((suggestions) => {
      if (cancelled) return;
      const firstSuggestion = suggestions[0]?.content;
      setNovaSuggestion(
        firstSuggestion ??
          containmentSuggestions[capa.id] ??
          "Immediately contain the affected product, system, or record scope and notify QA for documented assessment.",
      );
      setNovaReasoning(
        firstSuggestion
          ? "Generated from the enriched finding analysis packet and bounded to the affected source scope."
          : containmentReasoning[capa.id],
      );
    });

    return () => {
      cancelled = true;
    };
  }, [capa]);

  if (!capa) {
    return <NotFound message={`CAPA ${id ?? ""} is not available in the demo dataset.`} />;
  }

  const containmentScore = computeContainmentStrength(description, Boolean(pic), dueDate);
  const previewScore = computeTotalQualityScore({ ...capa.score, containment: containmentScore });
  const validation = evaluateContainment(description, pic, dueDate);
  const shouldShowBlocker = hasSubmitted && !validation.isValid;
  const passedCount = validation.checks.filter((c) => c.passed).length;

  function saveContainment(advance: boolean) {
    setHasSubmitted(true);

    if (!validation.isValid && !advance) {
      toast.error("Containment action blocked", {
        description: "Add a clear action, PIC, and today-or-future due date before continuing.",
      });
      return;
    }

    if (!validation.isValid && advance) {
      toast.warning("Continuing with incomplete containment", {
        description: "Nova will let you continue, but this step still needs a clear action, PIC, and today-or-future due date.",
      });
    }

    updateContainmentAction(capa.id, { description: description.trim(), pic, dueDate }, previewScore);
    addAuditEvent({
      actorName: "Nova Demo User",
      actorRole: "Initiator",
      domain: "system",
      eventType: "containment_added",
      action: `Containment action saved for ${capa.id}.`,
      capaId: capa.id,
      findingId: capa.findingId,
    });

    if (advance) {
      updateCurrentStep(capa.id, "rca");
      addNotification({
        recipientPersonaId: "qa_deviation",
        type: "capa_update",
        title: "Containment ready for review",
        description: `${capa.id} has a completed containment action and is ready for RCA review.`,
        capaId: capa.id,
        actionUrl: `/capa/${capa.id}`,
      });
      if (embedded && onStepChange) {
        onStepChange("rca");
      } else {
        navigate(`/capa/${capa.id}/8d/rca`);
      }
      return;
    }

    toast.success("Containment action saved", {
      description: `${capa.id} containment score is now ${containmentScore}/25.`,
    });
  }

  return (
    <EightDShell capaId={capa.id} activeStep="containment">
      <div className="flex flex-col gap-6">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div>
          <p className="mb-1.5 mt-0 font-sans text-xs tracking-[0.18em] text-primary">
            {capa.id} · D2
          </p>
          <h1 className="mb-2 mt-0 font-sans text-[22px] font-bold text-foreground">
            Containment Action
          </h1>
          <p className="m-0 max-w-[600px] text-[13px] leading-[1.55] text-foreground-tertiary">
            Define immediate containment for {capa.id}. Nova checks that the action is clear, accountable, and time-bound — and can offer a draft below if you want one.
          </p>
        </div>

        {/* ── Containment form ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-[18px] rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-5 shadow-sm">
          {/* Section label */}
          <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Containment Form
          </p>

          {/* Description */}
          <div>
            <label
              htmlFor="containment-action"
              className="mb-2 block font-sans text-xs font-semibold tracking-[0.02em] text-foreground-secondary"
            >
              Action description
            </label>
            <textarea
              id="containment-action"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              aria-invalid={shouldShowBlocker}
              placeholder="Describe the immediate hold, quarantine, restriction, review, or assessment action."
              className={cn(
                "box-border w-full resize-y rounded-[var(--r-sm)] border bg-[var(--field-bg)] px-3.5 py-3 font-sans text-[13px] leading-[1.65] text-foreground outline-none transition-[border-color,box-shadow] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]",
                shouldShowBlocker ? "border-destructive" : "border-[var(--line-2)]",
              )}
            />
            <div className="mt-1.5 flex justify-between">
              <span className="font-sans text-[11px] text-foreground-faint">
                {description.length} chars
              </span>
              <span className={cn("font-sans text-[11px]", passedCount === 4 ? "text-primary" : "text-foreground-faint")}>
                {passedCount}/4 checks passing
              </span>
            </div>
          </div>

          {/* PIC + Due date row */}
          <div className="grid grid-cols-2 gap-4">
            {/* PIC */}
            <div>
              <label
                htmlFor="containment-pic"
                className="mb-2 block font-sans text-xs font-semibold tracking-[0.02em] text-foreground-secondary"
              >
                Person in Charge
              </label>
              <div className="relative">
                <select
                  id="containment-pic"
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] py-[9px] pl-3 pr-9 font-sans text-[13px] text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]"
                >
                  {picOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <svg
                  width="12" height="12" viewBox="0 0 12 12"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground-tertiary"
                  fill="none" stroke="currentColor" strokeWidth="1.5"
                >
                  <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Due date */}
            <div>
              <label
                htmlFor="containment-due-date"
                className="mb-2 block font-sans text-xs font-semibold tracking-[0.02em] text-foreground-secondary"
              >
                Due date
              </label>
              <input
                id="containment-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="box-border w-full rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-3 py-[9px] font-sans text-[13px] text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]"
              />
            </div>
          </div>
        </div>

        {/* ── Blocker banner ───────────────────────────────────────────── */}
        {shouldShowBlocker && (
          <div role="alert" className="flex gap-2.5 rounded-[var(--r-sm)] border border-destructive/40 bg-[var(--danger-soft)] px-3.5 py-3">
            <AlertTriangle size={15} className="mt-px shrink-0 text-destructive" />
            <div>
              <p className="mb-0.5 mt-0 font-sans text-[13px] font-semibold text-destructive">
                Containment action is incomplete
              </p>
              <p className="m-0 font-sans text-xs text-foreground-tertiary">
                Add a clear containment description with hold/quarantine/restrict language, assign a PIC, and set a due date.
              </p>
            </div>
          </div>
        )}

        {/* ── Quality checklist ────────────────────────────────────────── */}
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
                  <p
                    className={cn(
                      "mb-0.5 mt-0 font-sans text-xs",
                      check.passed ? "font-medium text-foreground-secondary" : "font-normal text-foreground-tertiary",
                    )}
                  >
                    {check.label}
                  </p>
                  {!check.passed && (
                    <p className="m-0 font-sans text-[11px] text-foreground-faint">
                      {check.hint}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Score preview ────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 rounded-[var(--r-sm)] border border-border-subtle bg-elevated px-3.5 py-2.5">
          <span className="font-sans text-xs text-foreground-tertiary">
            Containment score preview:
          </span>
          <span
            className={cn(
              "font-sans text-[13px] font-bold",
              containmentScore >= 20 ? "text-success" : containmentScore >= 12 ? "text-warning" : "text-foreground-secondary",
            )}
          >
            {containmentScore}/25
          </span>
          <span className="font-sans text-xs text-foreground-faint">
            · Total quality score: {previewScore.total}/100
          </span>
        </div>

        {/* ── Nova assist (opt-in, below the user's own work) ──────────── */}
        <NovaAssistPanel
          title="Stuck? Let Nova draft a containment action"
          description="Write the immediate action your way. Nova's draft is here if you'd like a reference for the hold, quarantine, or review wording."
        >
          <NovaSuggestionBlock
            context="containment action"
            suggestion={
              novaSuggestion ||
              containmentSuggestions[capa.id] ||
              "Immediately contain the affected product, system, or record scope and notify QA for documented assessment."
            }
            reasoning={novaReasoning ?? containmentReasoning[capa.id]}
            capaId={capa.id}
            suggestionId="d2-containment"
            onAccept={(content) => setDescription(content)}
          />
        </NovaAssistPanel>

        {/* ── Footer actions ───────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2.5 border-t border-border-subtle pt-2">
          <button
            onClick={() => saveContainment(false)}
            className="flex cursor-pointer items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-4 py-2 font-sans text-[13px] font-medium text-foreground-secondary"
          >
            <Save size={14} />
            Save Draft
          </button>
          <button
            onClick={() => saveContainment(true)}
            className="cursor-pointer rounded-[var(--r-sm)] border-0 bg-[image:var(--grad-brand)] px-5 py-2 font-sans text-[13px] font-semibold tracking-[0.01em] text-primary-foreground"
          >
            Continue to D3 Root Cause Analysis →
          </button>
        </div>

      </div>
    </EightDShell>
  );
}
