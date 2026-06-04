import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Pencil, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { classifyImpact, draftGateAnswers, importSourceData, type GateDraftSet } from "@/services/novaService";
import { useCapaStore } from "@/store";
import type { CAPAType, GateQuestionID, ImpactClassification, PreFillContext, Severity } from "@/types";
import { computeIntakeScore, getPrefillSummary, getSuggestedTitle } from "@/utils/intakeHelpers";
import { formatDateTime } from "@/utils/formatters";
import { cn } from "@/lib/utils";

// ── Static config ─────────────────────────────────────────────────────────────

const SOURCE_CARDS = [
  {
    type: "deviation" as CAPAType,
    system: "Bizzmine",
    sourceId: "DEV-2026-0341",
    badge: "Deviation",
    description: "Environmental monitoring, process deviation, batch issue",
    badgeClass: "bg-[var(--accent-soft)] text-primary",
    selectedBorderClass: "border-[var(--accent-line)]",
    selectedButtonClass: "border-[var(--accent-line)] bg-[var(--accent-soft)] text-primary",
  },
  {
    type: "audit" as CAPAType,
    system: "Q100+",
    sourceId: "AUD-2026-0089",
    badge: "Audit finding",
    description: "Internal audit, regulatory inspection, compliance gap",
    badgeClass: "bg-[var(--success-soft)] text-success",
    selectedBorderClass: "border-success/40",
    selectedButtonClass: "border-success/40 bg-[var(--success-soft)] text-success",
  },
  {
    type: "complaint" as CAPAType,
    system: "Bizzmine",
    sourceId: "CMP-2026-0112",
    badge: "Complaint",
    description: "Customer complaint, adverse event, field quality report",
    badgeClass: "bg-[var(--warning-soft)] text-warning",
    selectedBorderClass: "border-warning/40",
    selectedButtonClass: "border-warning/40 bg-[var(--warning-soft)] text-warning",
  },
] as const;

const GATE_QUESTIONS: Array<{
  id: GateQuestionID;
  question: string;
  placeholder: string;
  required: boolean;
}> = [
  {
    id: "observation",
    question: "What happened and when was it observed?",
    placeholder: "Include date, shift, area, and measurable observation.",
    required: true,
  },
  {
    id: "impact",
    question: "What is the potential quality or GMP impact?",
    placeholder: "Explain why this may be Minor, Major, or Critical.",
    required: true,
  },
  {
    id: "containment",
    question: "What immediate containment is already in place?",
    placeholder: "Describe hold, quarantine, restriction, or review actions.",
    required: true,
  },
  {
    id: "scope",
    question: "Which product, batch, lot, equipment, or area is affected?",
    placeholder: "Name affected batch/lot, equipment ID, area, and source record.",
    required: false,
  },
  {
    id: "cause_confirmation",
    question: "What evidence is needed to confirm the root cause?",
    placeholder: "Mention records, trend review, sample assessment, or investigation method.",
    required: false,
  },
  {
    id: "effectiveness_criteria",
    question: "How will effectiveness be verified?",
    placeholder: "Define expected evidence and timeframe.",
    required: false,
  },
];

const SEVERITY_OPTIONS: Array<{
  value: Severity;
  label: string;
  description: string;
  toneClass: string;
  selectedClass: string;
  radioClass: string;
  weight: string;
}> = [
  {
    value: "Minor",
    label: "Minor",
    description: "Limited product impact. No direct patient risk. Correctable at site level without regulatory notification.",
    toneClass: "text-warning",
    selectedClass: "border-warning/40 bg-[var(--warning-soft)]",
    radioClass: "border-warning bg-warning",
    weight: "Low",
  },
  {
    value: "Major",
    label: "Major",
    description: "Significant process deviation or compliance gap. Potential product impact. Requires full CAPA investigation.",
    toneClass: "text-destructive",
    selectedClass: "border-destructive/40 bg-[var(--danger-soft)]",
    radioClass: "border-destructive bg-destructive",
    weight: "Medium",
  },
  {
    value: "Critical",
    label: "Critical",
    description: "Direct patient safety or regulatory risk. Immediate containment and escalation required. May trigger recall assessment.",
    toneClass: "text-destructive",
    selectedClass: "border-destructive/40 bg-[var(--danger-soft)]",
    radioClass: "border-destructive bg-destructive",
    weight: "High",
  },
];

const STEP_LABELS = ["Source import", "Gate questions", "Impact assessment", "Review & submit"];
const STEP_EYEBROW_CLASS = "mb-1 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-faint";
const STEP_TITLE_CLASS = "mb-1.5 mt-0 font-sans text-[17px] font-bold text-foreground";
const STEP_COPY_CLASS = "font-sans text-[13px] text-foreground-tertiary";

// ── Helper functions ──────────────────────────────────────────────────────────

function isCAPAType(value: string | null): value is CAPAType {
  return value === "deviation" || value === "audit" || value === "complaint";
}

function getPrefillSource(prefill: PreFillContext) {
  if (prefill.source === "Bizzmine-Complaint") return "Bizzmine";
  return prefill.source;
}

const EMPTY_GATE_ANSWERS: Record<GateQuestionID, string> = {
  observation: "",
  scope: "",
  impact: "",
  containment: "",
  cause_confirmation: "",
  effectiveness_criteria: "",
};

type GateProvenance = "drafted" | "edited" | "none";

// ── Provenance chip (Nova draft vs. user-edited) ──────────────────────────────

function GateProvenanceChip({ status }: { status: GateProvenance }) {
  if (status === "none") return null;

  if (status === "drafted") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-[var(--r-full)] bg-[var(--accent-soft)] px-2 py-0.5 font-sans text-[10px] font-semibold tracking-[0.04em] text-primary">
        <Sparkles size={10} aria-hidden="true" />
        Nova draft
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-[var(--r-full)] border border-border-subtle bg-elevated px-2 py-0.5 font-sans text-[10px] font-semibold tracking-[0.04em] text-foreground-tertiary">
      <Pencil size={10} aria-hidden="true" />
      Edited
    </span>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-start justify-center">
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < current;
        const isActive = stepNum === current;

        return (
          <div key={label} className={cn("flex items-start", i < STEP_LABELS.length - 1 && "flex-1")}>
            {/* Step node */}
            <div className="flex shrink-0 flex-col items-center gap-2">
              {/* Circle */}
              <div
                className={cn(
                  "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full transition-[background] duration-300",
                  isDone || isActive ? "border-0 bg-[image:var(--grad-brand)]" : "border border-[var(--line-2)] bg-field",
                )}
              >
                {isDone ? (
                  <Check size={14} className="text-primary-foreground" strokeWidth={2.5} />
                ) : (
                  <span
                    className={cn(
                      "font-sans text-xs font-bold",
                      isActive ? "text-primary-foreground" : "text-foreground-faint",
                    )}
                  >
                    {stepNum}
                  </span>
                )}
              </div>
              {/* Label */}
              <span
                className={cn(
                  "whitespace-nowrap text-center font-sans text-[11px]",
                  isActive ? "font-semibold text-foreground" : isDone ? "font-normal text-foreground-secondary" : "font-normal text-foreground-faint",
                )}
              >
                {label}
              </span>
            </div>

            {/* Connector line (not after last step) */}
            {i < STEP_LABELS.length - 1 && (
              <div
                className={cn(
                  "mt-3.5 h-px min-w-8 flex-1 transition-[background] duration-300",
                  isDone ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Reusable field components ─────────────────────────────────────────────────

function FieldLabel({
  children,
  required,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block font-sans text-xs font-semibold text-foreground-secondary"
    >
      {children}
      {required && (
        <span className="ml-[3px] text-destructive" aria-hidden="true">*</span>
      )}
      {required && <span className="sr-only"> (required)</span>}
    </label>
  );
}

function StyledTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  id?: string;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="box-border w-full resize-y rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-3 py-2.5 font-sans text-[13px] leading-[1.6] text-foreground outline-none transition-[border-color,box-shadow] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]"
    />
  );
}

function ReviewField({
  label,
  value,
  longLabel,
}: {
  label: string;
  value?: string | null;
  /** Use for sentence-length labels (e.g. gate questions) where eyebrow letter-spacing hurts readability. */
  longLabel?: boolean;
}) {
  if (!value) return null;
  return (
    <div>
      <p
        className={
          longLabel
            ? "mb-1 mt-0 font-sans text-[12px] font-semibold leading-[1.5] text-foreground-secondary"
            : "mb-1 mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-faint"
        }
      >
        {label}
      </p>
      <p
        className="m-0 font-sans text-[13px] leading-[1.55] text-foreground"
      >
        {value}
      </p>
    </div>
  );
}

// ── Wizard card shell ────────────────────────────────────────────────────────

function WizardCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-8 shadow-sm"
    >
      {children}
    </div>
  );
}

// ── Navigation buttons ────────────────────────────────────────────────────────

function NavButtons({
  step,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  isLoading = false,
}: {
  step: number;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isLoading?: boolean;
}) {
  return (
    <div
      className="mt-7 flex items-center justify-between border-t border-border-subtle pt-5"
    >
      {step > 1 && onBack ? (
        <button
          onClick={onBack}
          className="flex cursor-pointer items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-transparent px-4 py-2 font-sans text-[13px] text-foreground-tertiary hover:bg-elevated hover:text-foreground-secondary"
        >
          <ArrowLeft size={13} />
          Back
        </button>
      ) : (
        <div />
      )}

      <button
        onClick={onNext}
        disabled={nextDisabled || isLoading}
        className={cn(
          "flex items-center gap-1.5 rounded-[var(--r-sm)] border-0 px-5 py-[9px] font-sans text-[13px] font-semibold tracking-[0.01em] transition-opacity [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
          nextDisabled
            ? "cursor-not-allowed bg-field text-foreground-faint opacity-60"
            : isLoading
              ? "cursor-not-allowed bg-[image:var(--grad-brand)] text-primary-foreground"
              : "cursor-pointer bg-[image:var(--grad-brand)] text-primary-foreground",
        )}
      >
        {isLoading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Importing…
          </>
        ) : (
          <>
            {nextLabel}
            {step < 4 && <ArrowRight size={13} />}
          </>
        )}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CapaIntakePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryType = searchParams.get("type");
  const querySourceId = searchParams.get("sourceId");
  const initialType = isCAPAType(queryType) ? queryType : "deviation";

  // Wizard state
  const [step, setStep] = useState(1);

  // Step 1 — source
  const [selectedType, setSelectedType] = useState<CAPAType>(initialType);
  const [sourceId, setSourceId] = useState(
    querySourceId ?? SOURCE_CARDS.find((c) => c.type === initialType)?.sourceId ?? "DEV-2026-0341",
  );
  const [prefill, setPrefill] = useState<PreFillContext | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  // Step 2 — gate questions
  const [gateAnswers, setGateAnswers] = useState<Record<GateQuestionID, string>>({
    ...EMPTY_GATE_ANSWERS,
  });
  // The original answers Nova drafted from the source doc, kept so we can show
  // per-field "Nova draft" vs "Edited" provenance and offer a restore action.
  const [novaDraft, setNovaDraft] = useState<Record<GateQuestionID, string> | null>(null);
  const [draftMeta, setDraftMeta] = useState<Pick<GateDraftSet, "sourceLabel" | "confidence"> | null>(null);

  // Step 3 — impact
  const [impactClassification, setImpactClassification] = useState<ImpactClassification | undefined>();
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | undefined>();
  const [title, setTitle] = useState(getSuggestedTitle(initialType));

  // Step 4 — submit
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const submitIntake = useCapaStore((state) => state.submitIntake);
  const existingFinding = useCapaStore((state) =>
    state.findings.find((f) => f.id === sourceId),
  );

  // When source card selection changes, reset prefill
  useEffect(() => {
    if (!querySourceId) {
      const card = SOURCE_CARDS.find((c) => c.type === selectedType);
      if (card) setSourceId(card.sourceId);
    }
    setPrefill(undefined);
    setImpactClassification(undefined);
    setTitle(getSuggestedTitle(selectedType));
    setGateAnswers({ ...EMPTY_GATE_ANSWERS });
    setNovaDraft(null);
    setDraftMeta(null);
  }, [querySourceId, selectedType]);

  // Per-field provenance: did the user keep Nova's draft, or revise it?
  function gateProvenance(id: GateQuestionID): GateProvenance {
    if (!novaDraft) return "none";
    const draft = novaDraft[id];
    if (!draft) return "none";
    const current = gateAnswers[id];
    if (current === draft) return "drafted";
    if (current.trim().length > 0) return "edited";
    return "none";
  }

  function restoreGateDraft(id: GateQuestionID) {
    if (!novaDraft) return;
    setGateAnswers((prev) => ({ ...prev, [id]: novaDraft[id] }));
  }

  const draftedFieldCount = novaDraft
    ? Object.values(novaDraft).filter((value) => value.trim().length > 0).length
    : 0;

  // Sync Nova severity to selector default
  useEffect(() => {
    if (impactClassification?.severity) {
      setSelectedSeverity(impactClassification.severity);
    }
  }, [impactClassification]);

  const score = useMemo(() => computeIntakeScore(title, gateAnswers), [title, gateAnswers]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleImport(type: CAPAType, id: string) {
    setIsLoading(true);
    setSelectedType(type);
    setSourceId(id);
    try {
      const imported = await importSourceData(type, id);
      setPrefill(imported);
      const suggestedTitle = getSuggestedTitle(type, imported);
      setTitle(suggestedTitle);
      const classification = await classifyImpact(imported);
      setImpactClassification(classification);
      setSelectedSeverity(classification.severity);

      // Nova reads the imported finding and drafts every gate answer so Andi
      // reviews and refines instead of writing from a blank page.
      const draft = await draftGateAnswers(type);
      setGateAnswers({ ...EMPTY_GATE_ANSWERS, ...draft.answers });
      setNovaDraft({ ...EMPTY_GATE_ANSWERS, ...draft.answers });
      setDraftMeta({ sourceLabel: draft.sourceLabel, confidence: draft.confidence });

      toast("Source imported · gate answers drafted", {
        description: `Nova read ${getPrefillSource(imported)} and drafted the gate answers for your review.`,
      });
      setStep(2);
    } catch (err) {
      toast.error("Import failed", {
        description: err instanceof Error ? err.message : "Nova could not import the source record.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleManualMode() {
    setManualMode(true);
    setPrefill(undefined);
    setGateAnswers({ ...EMPTY_GATE_ANSWERS });
    setNovaDraft(null);
    setDraftMeta(null);
    setStep(2);
  }

  function handleSubmit() {
    setSubmitAttempted(true);

    const gateAnswerList = GATE_QUESTIONS.filter((q) => gateAnswers[q.id].trim()).map((q) => ({
      questionId: q.id,
      question: q.question,
      answer: gateAnswers[q.id].trim(),
      novaScoreContribution: 0,
      needsImprovement: false,
    }));

    const capa = submitIntake({
      findingId: sourceId,
      type: selectedType,
      title,
      severity: selectedSeverity ?? "Major",
      gateAnswers: gateAnswerList,
      impact: impactClassification,
    });

    if (!capa) {
      toast.error("CAPA could not be submitted", {
        description: "The selected source finding is not available in the demo dataset.",
      });
      return;
    }

    if (capa.status === "pending_review") {
      toast.success("Submitted for intake review", {
        description: `${capa.id} now awaits approval from Siti Rahmawati (QA) and Bambang Saputra (Department Head).`,
      });
    } else {
      toast.info("CAPA already in progress", {
        description: `${capa.id} has already cleared intake review.`,
      });
    }
    navigate(`/capa/${capa.id}`);
  }

  // ── Step validation ─────────────────────────────────────────────────────────

  const step2Valid = gateAnswers.observation.trim().length >= 20;
  const step3Valid = Boolean(selectedSeverity);

  // ── Gate field renderer (shared by required + optional groups) ───────────────

  function renderGateField(q: (typeof GATE_QUESTIONS)[number], rows: number) {
    const status = gateProvenance(q.id);
    return (
      <div key={q.id}>
        <div className="flex items-start justify-between gap-2">
          <FieldLabel required={q.required} htmlFor={`gate-${q.id}`}>
            {q.question}
          </FieldLabel>
          <div className="flex shrink-0 items-center gap-1.5 pt-px">
            {status === "edited" && (
              <button
                type="button"
                onClick={() => restoreGateDraft(q.id)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-[var(--r-full)] border border-border-subtle bg-transparent px-2 py-0.5 font-sans text-[10px] font-semibold text-foreground-tertiary transition-colors [transition-duration:var(--dur-fast)] hover:bg-elevated hover:text-foreground-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card"
              >
                <RotateCcw size={10} aria-hidden="true" />
                Restore draft
              </button>
            )}
            <GateProvenanceChip status={status} />
          </div>
        </div>
        <StyledTextarea
          id={`gate-${q.id}`}
          value={gateAnswers[q.id]}
          onChange={(v) => setGateAnswers((prev) => ({ ...prev, [q.id]: v }))}
          placeholder={q.placeholder}
          rows={rows}
        />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="mx-auto flex max-w-[720px] flex-col gap-7"
    >
      {/* Page header */}
      <div>
        <Link
          to="/findings"
          className="mb-2.5 inline-flex items-center gap-[5px] font-sans text-xs text-foreground-tertiary no-underline hover:text-foreground-secondary"
        >
          <ArrowLeft size={13} />
          Back to findings
        </Link>
        <h1
          className="mb-1 mt-0 font-sans text-[22px] font-bold tracking-[-0.02em] text-foreground"
        >
          New CAPA intake
        </h1>
        <p className="m-0 font-sans text-[13px] text-foreground-tertiary">
          Import from source system, answer gate questions, and create an audit-ready CAPA workflow.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* ── Step 1: Source Import ─────────────────────────────────────────── */}
      {step === 1 && (
        <WizardCard>
          <p
            className={STEP_EYEBROW_CLASS}
          >
            Step 1
          </p>
          <h2
            className={STEP_TITLE_CLASS}
          >
            Source import
          </h2>
          <p className={cn(STEP_COPY_CLASS, "mb-6 mt-0")}>
            Select a connected source system to auto-populate source data, or fill manually.
          </p>

          {/* Source system cards */}
          <div className="mb-3 grid grid-cols-3 gap-3">
            {SOURCE_CARDS.map((card) => {
              const isImported = selectedType === card.type && Boolean(prefill);
              return (
              <div
                key={card.type}
                className={cn(
                  "flex flex-col gap-2.5 rounded-[var(--r-md)] border bg-elevated p-4 transition-[border-color] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
                  isImported ? card.selectedBorderClass : "border-[var(--line-2)]",
                )}
              >
                {/* System header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p
                      className="mb-0.5 mt-0 font-sans text-sm font-bold text-foreground"
                    >
                      {card.system}
                    </p>
                    <span
                      className={cn(
                        "inline-block rounded-[var(--r-full)] px-1.5 py-px font-sans text-[10px] font-semibold tracking-[0.18em]",
                        card.badgeClass,
                      )}
                    >
                      {card.badge}
                    </span>
                  </div>
                  {/* Connected badge */}
                  <span
                    className="rounded-[var(--r-full)] bg-[var(--success-soft)] px-[7px] py-0.5 font-sans text-[10px] font-semibold text-success"
                  >
                    Connected
                  </span>
                </div>

                {/* Source ID */}
                <p
                  className="m-0 rounded-[var(--r-sm)] border border-border-subtle bg-[var(--field-bg)] px-2 py-1 font-sans text-[11px] text-foreground-tertiary"
                >
                  {card.sourceId}
                </p>

                {/* Description */}
                <p className="m-0 font-sans text-[11px] leading-[1.4] text-foreground-faint">
                  {card.description}
                </p>

                {/* Import button */}
                <button
                  onClick={() => handleImport(card.type, card.sourceId)}
                  disabled={isLoading}
                  className={cn(
                    "mt-auto flex w-full items-center justify-center gap-[5px] rounded-[var(--r-sm)] border px-0 py-[7px] font-sans text-xs font-semibold transition-[background,border-color,color,filter] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
                    isLoading ? "cursor-wait" : "cursor-pointer",
                    isImported ? card.selectedButtonClass : "border-[var(--line-2)] bg-field text-foreground-secondary",
                  )}
                >
                  {isLoading && selectedType === card.type ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Importing…
                    </>
                  ) : selectedType === card.type && prefill ? (
                    <>
                      <Check size={12} strokeWidth={2.5} />
                      Imported
                    </>
                  ) : (
                    <>
                      Import and continue
                      <ArrowRight size={12} />
                    </>
                  )}
                </button>
              </div>
            )})}
          </div>

          {/* Manual option */}
          <button
            onClick={handleManualMode}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--r-md)] border border-dashed border-[var(--line-2)] bg-transparent p-3 font-sans text-[13px] text-foreground-tertiary hover:bg-elevated hover:text-foreground-secondary"
          >
            Fill manually without source import
            <ArrowRight size={13} />
          </button>

          {existingFinding?.linkedCapaId && (
            <div
              className="mt-4 rounded-[var(--r-sm)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3.5 py-2.5 font-sans text-xs text-primary"
            >
              <Sparkles size={12} className="mr-1.5 inline" />
              This finding is already linked to {existingFinding.linkedCapaId}. If it cleared intake review, submitting just reopens it; if it was sent back for re-work, your edits will be resubmitted to Siti and Bambang.
            </div>
          )}
        </WizardCard>
      )}

      {/* ── Step 2: Gate Questions ────────────────────────────────────────── */}
      {step === 2 && (
        <WizardCard>
          <p
            className={STEP_EYEBROW_CLASS}
          >
            Step 2
          </p>
          <h2
            className={STEP_TITLE_CLASS}
          >
            Gate questions
          </h2>
          <p className={cn(STEP_COPY_CLASS, "mb-5 mt-0")}>
            Answer questions to help Nova assess severity and scope. Be specific: include dates, batch numbers, and measurable observations.
          </p>

          {/* Nova draft banner (after import) or generic tip (manual mode) */}
          {draftMeta ? (
            <div className="mb-6 flex gap-2.5 rounded-[var(--r-md)] border-l-[3px] border-l-primary bg-[var(--accent-soft)] px-4 py-3.5">
              <Sparkles size={15} className="mt-px shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="m-0 font-sans text-[13px] font-bold text-primary">
                    Nova drafted your gate answers
                  </p>
                  <span className="rounded-[var(--r-full)] bg-card/70 px-2 py-px font-sans text-[10px] font-semibold tracking-[0.04em] text-primary">
                    {draftMeta.confidence}% confidence
                  </span>
                </div>
                <p className="m-0 font-sans text-xs leading-[1.55] text-foreground-secondary">
                  Nova read <span className="font-semibold text-foreground">{draftMeta.sourceLabel}</span> and pre-filled {draftedFieldCount} {draftedFieldCount === 1 ? "answer" : "answers"} below.
                  Review each one, add any detail Nova could not see, then continue. Fields you change are marked <span className="font-semibold text-foreground-secondary">Edited</span>.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-6 flex gap-2.5 rounded-[var(--r-md)] border-l-[3px] border-l-primary bg-elevated px-4 py-3">
              <Sparkles size={14} className="mt-px shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="mb-[3px] mt-0 font-sans text-xs font-semibold text-primary">
                  Nova tip
                </p>
                <p className="m-0 font-sans text-xs leading-[1.55] text-foreground-tertiary">
                  Be specific about dates, batch numbers, and measurable observations. Vague answers will lower your quality score and may delay CAPA approval.
                </p>
              </div>
            </div>
          )}

          {/* Required questions */}
          <div className="flex flex-col gap-[18px]">
            {GATE_QUESTIONS.filter((q) => q.required).map((q) => renderGateField(q, 4))}

            {/* Additional context */}
            <div
              className="border-t border-border-subtle pt-[18px]"
            >
              <p
                className="mb-4 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-faint"
              >
                Additional context (recommended)
              </p>
              <div className="flex flex-col gap-3.5">
                {GATE_QUESTIONS.filter((q) => !q.required).map((q) => renderGateField(q, 3))}
              </div>
            </div>
          </div>

          <NavButtons
            step={step}
            onBack={() => setStep(1)}
            onNext={() => {
              if (!step2Valid) {
                toast.error("Please answer the first question", {
                  description: "Describe what happened with at least a brief explanation.",
                });
                return;
              }
              setStep(3);
            }}
            nextLabel="Continue to impact"
          />
        </WizardCard>
      )}

      {/* ── Step 3: Impact Assessment ─────────────────────────────────────── */}
      {step === 3 && (
        <WizardCard>
          <p
            className={STEP_EYEBROW_CLASS}
          >
            Step 3
          </p>
          <h2
            className={STEP_TITLE_CLASS}
          >
            Impact assessment
          </h2>
          <p className={cn(STEP_COPY_CLASS, "mb-6 mt-0")}>
            Select a severity level. Nova's recommendation is pre-filled if you imported source data.
          </p>

          {/* Nova AI assessment */}
          {impactClassification ? (
            <div
              className="mb-6 rounded-[var(--r-md)] border-l-[3px] border-l-primary bg-elevated px-4 py-3.5"
            >
              <div className="mb-2 flex items-center gap-2">
                <Sparkles size={13} className="text-primary" />
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Nova assessment
                </span>
                <span
                  className={cn(
                    "ml-1 rounded-[var(--r-full)] px-2 py-px font-sans text-[11px] font-bold",
                    impactClassification.severity === "Minor"
                      ? "bg-[var(--warning-soft)] text-warning"
                      : "bg-[var(--danger-soft)] text-destructive",
                  )}
                >
                  {impactClassification.severity}
                </span>
                <span className="ml-auto font-sans text-[11px] text-foreground-tertiary">
                  {Math.round(impactClassification.totalWeight)}% confidence
                </span>
              </div>
              <p className="mb-2.5 mt-0 font-sans text-xs leading-[1.55] text-foreground-secondary">
                {impactClassification.rationale}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {impactClassification.factors.map((factor) => (
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
                    <p className="m-0 font-sans text-[10px] text-primary">
                      Weight {factor.weight}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="mb-6 flex gap-2.5 rounded-[var(--r-md)] border border-border-subtle bg-elevated px-4 py-3"
            >
              <Sparkles size={13} className="mt-px shrink-0 text-foreground-faint" />
              <p className="m-0 font-sans text-xs text-foreground-tertiary">
                No source data was imported. Select a severity level manually based on your assessment.
              </p>
            </div>
          )}

          {/* Severity cards */}
          <p
            className="mb-2.5 mt-0 font-sans text-xs font-semibold text-foreground-secondary"
          >
            Severity classification <span className="text-destructive">*</span>
          </p>
          <div className="mb-6 grid grid-cols-3 gap-2.5">
            {SEVERITY_OPTIONS.map((opt) => {
              const isSelected = selectedSeverity === opt.value;
              const isNova = impactClassification?.severity === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setSelectedSeverity(opt.value)}
                  className={cn(
                    "relative cursor-pointer rounded-[var(--r-md)] border p-3.5 text-left transition-[background,border-color,color,box-shadow] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)]",
                    isSelected ? opt.selectedClass : "border-[var(--line-2)] bg-elevated",
                  )}
                >
                  {/* Nova recommendation badge */}
                  {isNova && (
                    <span
                      className="absolute right-2 top-2 rounded-[var(--r-full)] bg-[var(--accent-soft)] px-[5px] py-px font-sans text-[9px] font-semibold tracking-[0.18em] text-primary"
                    >
                      Nova
                    </span>
                  )}
                  {/* Radio indicator */}
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                        isSelected ? opt.radioClass : "border-[var(--line-3)] bg-transparent",
                      )}
                    >
                      {isSelected && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                    <span
                      className={cn("font-sans text-[13px] font-bold", isSelected ? opt.toneClass : "text-foreground-secondary")}
                    >
                      {opt.label}
                    </span>
                  </div>
                  <p className="m-0 font-sans text-[11px] leading-[1.45] text-foreground-tertiary">
                    {opt.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* CAPA title */}
          <div>
            <FieldLabel required htmlFor="capa-title">CAPA title</FieldLabel>
            <input
              id="capa-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title for this CAPA"
              className="box-border w-full rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-3 py-[9px] font-sans text-[13px] text-foreground outline-none transition-[border-color,box-shadow] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]"
            />
          </div>

          <NavButtons
            step={step}
            onBack={() => setStep(2)}
            onNext={() => {
              if (!step3Valid) {
                toast.error("Select a severity level", {
                  description: "Choose Minor, Major, or Critical before continuing.",
                });
                return;
              }
              setStep(4);
            }}
            nextLabel="Review & submit"
          />
        </WizardCard>
      )}

      {/* ── Step 4: Review & Submit ────────────────────────────────────────── */}
      {step === 4 && (
        <WizardCard>
          <p className={STEP_EYEBROW_CLASS}>
            Step 4
          </p>
          <h2 className={STEP_TITLE_CLASS}>
            Review & submit
          </h2>
          <p className={cn(STEP_COPY_CLASS, "mb-6 mt-0")}>
            Review the CAPA details before submitting. This sends the intake to Siti Rahmawati (QA) and Bambang Saputra (Department Head) for review — the 8D workflow unlocks only after both approve.
          </p>

          {/* Summary cards */}
          <div className="flex flex-col gap-4">

            {/* Source summary */}
            <div className="rounded-[var(--r-md)] border border-border-subtle bg-elevated p-4">
              <p className="mb-3 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-faint">
                Source data
              </p>
              <div className="grid grid-cols-2 gap-3">
                <ReviewField label="CAPA type" value={selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} />
                <ReviewField label="Source ID" value={sourceId} />
                <ReviewField label="System" value={prefill ? getPrefillSource(prefill) : "Manual entry"} />
                <ReviewField label="Severity" value={selectedSeverity} />
              </div>
              {title && (
                <div className="mt-3 border-t border-border-subtle pt-3">
                  <ReviewField label="CAPA title" value={title} />
                </div>
              )}
            </div>

            {/* Imported source detail */}
            {prefill && (
              <div className="rounded-[var(--r-md)] border border-border-subtle bg-elevated p-4">
                <p className="mb-3 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-faint">
                  Imported from {getPrefillSource(prefill)}
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {getPrefillSummary(prefill).slice(0, 6).map(([label, value]) => (
                    <ReviewField key={label} label={label} value={value} />
                  ))}
                </div>
              </div>
            )}

            {/* Gate answers */}
            <div className="rounded-[var(--r-md)] border border-border-subtle bg-elevated p-4">
              <p className="mb-3 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-faint">
                Gate questions
              </p>
              <div className="flex flex-col gap-2.5">
                {GATE_QUESTIONS.filter((q) => gateAnswers[q.id].trim()).map((q) => (
                  <ReviewField key={q.id} label={q.question} value={gateAnswers[q.id]} longLabel />
                ))}
                {!Object.values(gateAnswers).some((v) => v.trim()) && (
                  <p className="m-0 font-sans text-xs text-foreground-faint">
                    No answers provided.
                  </p>
                )}
              </div>
            </div>

            {/* Readiness checklist */}
            <div className="rounded-[var(--r-md)] border border-border-subtle bg-elevated p-4">
              <p className="mb-3 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-faint">
                Readiness check
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Source imported or manual mode selected", passed: Boolean(prefill) || manualMode },
                  { label: "Gate questions answered", passed: gateAnswers.observation.trim().length >= 20 },
                  { label: "Severity level selected", passed: Boolean(selectedSeverity) },
                  { label: "CAPA title provided", passed: title.trim().length >= 10 },
                  { label: "Nova impact classification", passed: Boolean(impactClassification) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <CheckCircle2
                      size={14}
                      className={cn("shrink-0", item.passed ? "text-success" : "text-foreground-faint")}
                    />
                    <span className={cn("font-sans text-xs", item.passed ? "text-foreground-secondary" : "text-foreground-faint")}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit / Back */}
          <div className="mt-7 flex items-center justify-between border-t border-border-subtle pt-5">
            <button
              onClick={() => setStep(3)}
              className="flex cursor-pointer items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-transparent px-4 py-2 font-sans text-[13px] text-foreground-tertiary hover:bg-elevated hover:text-foreground-secondary"
            >
              <ArrowLeft size={13} />
              Back
            </button>

            <button
              onClick={handleSubmit}
              className="flex cursor-pointer items-center gap-2 rounded-[var(--r-sm)] border-0 bg-[image:var(--grad-brand)] px-7 py-2.5 font-sans text-sm font-bold tracking-[0.01em] text-primary-foreground"
            >
              Submit for review
              <ArrowRight size={15} />
            </button>
          </div>
        </WizardCard>
      )}
    </div>
  );
}
