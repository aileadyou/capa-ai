import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { classifyImpact, importSourceData } from "@/services/novaService";
import { useCapaStore } from "@/store";
import type { CAPAType, GateQuestionID, ImpactClassification, PreFillContext, Severity } from "@/types";
import { computeIntakeScore, getPrefillSummary, getSuggestedTitle } from "@/utils/intakeHelpers";
import { formatDateTime } from "@/utils/formatters";

// ── Static config ─────────────────────────────────────────────────────────────

const SOURCE_CARDS = [
  {
    type: "deviation" as CAPAType,
    system: "Bizzmine",
    sourceId: "DEV-2026-0341",
    badge: "Deviation",
    description: "Environmental monitoring, process deviation, batch issue",
    color: "#A94DCC",
  },
  {
    type: "audit" as CAPAType,
    system: "Q100+",
    sourceId: "AUD-2026-0089",
    badge: "Audit finding",
    description: "Internal audit, regulatory inspection, compliance gap",
    color: "#3FB984",
  },
  {
    type: "complaint" as CAPAType,
    system: "Bizzmine",
    sourceId: "CMP-2026-0112",
    badge: "Complaint",
    description: "Customer complaint, adverse event, field quality report",
    color: "#E0A33E",
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
  color: string;
  weight: string;
}> = [
  {
    value: "Minor",
    label: "Minor",
    description: "Limited product impact. No direct patient risk. Correctable at site level without regulatory notification.",
    color: "#E0A33E",
    weight: "Low",
  },
  {
    value: "Major",
    label: "Major",
    description: "Significant process deviation or compliance gap. Potential product impact. Requires full CAPA investigation.",
    color: "#E5575C",
    weight: "Medium",
  },
  {
    value: "Critical",
    label: "Critical",
    description: "Direct patient safety or regulatory risk. Immediate containment and escalation required. May trigger recall assessment.",
    color: "#E5575C",
    weight: "High",
  },
];

const STEP_LABELS = ["Source import", "Gate questions", "Impact assessment", "Review & submit"];

// ── Helper functions ──────────────────────────────────────────────────────────

function isCAPAType(value: string | null): value is CAPAType {
  return value === "deviation" || value === "audit" || value === "complaint";
}

function getPrefillSource(prefill: PreFillContext) {
  if (prefill.source === "Bizzmine-Complaint") return "Bizzmine Complaint";
  return prefill.source;
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < current;
        const isActive = stepNum === current;

        return (
          <div key={label} style={{ display: "flex", alignItems: "flex-start", flex: i < STEP_LABELS.length - 1 ? 1 : "none" }}>
            {/* Step node */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              {/* Circle */}
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: isDone || isActive ? "var(--grad-brand)" : "var(--bg-4)",
                  border: isDone || isActive ? "none" : "1px solid var(--line-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.3s",
                }}
              >
                {isDone ? (
                  <Check size={14} style={{ color: "var(--on-accent)" }} strokeWidth={2.5} />
                ) : (
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: isActive ? "var(--on-accent)" : "var(--fg-4)",
                    }}
                  >
                    {stepNum}
                  </span>
                )}
              </div>
              {/* Label */}
              <span
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-sans)",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--fg-1)" : isDone ? "var(--fg-2)" : "var(--fg-4)",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </div>

            {/* Connector line (not after last step) */}
            {i < STEP_LABELS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  marginTop: "14px",
                  background: isDone ? "var(--accent)" : "var(--line-2)",
                  minWidth: "32px",
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Reusable field components ─────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--fg-2)",
        marginBottom: "6px",
        fontFamily: "var(--font-sans)",
      }}
    >
      {children}
      {required && (
        <span style={{ color: "#E5575C", marginLeft: "3px" }}>*</span>
      )}
    </label>
  );
}

function StyledTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%",
        background: "var(--bg-4)",
        border: "1px solid var(--line-2)",
        borderRadius: "var(--r-sm)",
        padding: "10px 12px",
        fontSize: "13px",
        lineHeight: "1.6",
        color: "var(--fg-1)",
        fontFamily: "var(--font-sans)",
        resize: "vertical",
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--line-2)";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

function ReviewField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p
        style={{
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--fg-4)",
          margin: "0 0 4px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "13px",
          color: "var(--fg-1)",
          margin: 0,
          lineHeight: "1.55",
          fontFamily: "var(--font-sans)",
        }}
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
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line-2)",
        borderRadius: "var(--r-lg)",
        padding: "32px",
      }}
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
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "28px",
        paddingTop: "20px",
        borderTop: "1px solid var(--line-1)",
      }}
    >
      {step > 1 && onBack ? (
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "transparent",
            color: "var(--fg-3)",
            border: "1px solid var(--line-2)",
            borderRadius: "var(--r-sm)",
            padding: "8px 16px",
            fontSize: "13px",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
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
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: nextDisabled ? "var(--bg-4)" : "var(--grad-brand)",
          color: nextDisabled ? "var(--fg-4)" : "var(--on-accent)",
          border: "none",
          borderRadius: "var(--r-sm)",
          padding: "9px 20px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: nextDisabled || isLoading ? "not-allowed" : "pointer",
          fontFamily: "var(--font-sans)",
          letterSpacing: "0.01em",
          opacity: nextDisabled ? 0.6 : 1,
          transition: "opacity 0.15s",
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
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
    observation: "",
    scope: "",
    impact: "",
    containment: "",
    cause_confirmation: "",
    effectiveness_criteria: "",
  });

  // Step 3 — impact
  const [impactClassification, setImpactClassification] = useState<ImpactClassification | undefined>();
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | undefined>();
  const [title, setTitle] = useState(getSuggestedTitle(initialType));

  // Step 4 — submit
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const createCAPAFromFinding = useCapaStore((state) => state.createCAPAFromFinding);
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
  }, [querySourceId, selectedType]);

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
      toast("Source data imported", {
        description: `Imported from ${getPrefillSource(imported)}.`,
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
    setStep(2);
  }

  function handleSubmit() {
    setSubmitAttempted(true);
    const capa = createCAPAFromFinding(sourceId, selectedType);
    if (!capa) {
      toast.error("CAPA could not be created", {
        description: "The selected source finding is not available in the demo dataset.",
      });
      return;
    }
    toast.success("CAPA created", {
      description: `${capa.id} is ready for the 8D workflow.`,
    });
    navigate(`/capa/${capa.id}`);
  }

  // ── Step validation ─────────────────────────────────────────────────────────

  const step2Valid = gateAnswers.observation.trim().length >= 20;
  const step3Valid = Boolean(selectedSeverity);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        maxWidth: "720px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "28px",
      }}
    >
      {/* Page header */}
      <div>
        <Link
          to="/findings"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "12px",
            color: "var(--fg-3)",
            textDecoration: "none",
            marginBottom: "10px",
            fontFamily: "var(--font-sans)",
          }}
        >
          <ArrowLeft size={13} />
          Back to findings
        </Link>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "var(--fg-1)",
            margin: "0 0 4px",
            fontFamily: "var(--font-sans)",
            letterSpacing: "-0.02em",
          }}
        >
          New CAPA intake
        </h1>
        <p style={{ fontSize: "13px", color: "var(--fg-3)", margin: 0, fontFamily: "var(--font-sans)" }}>
          Import from source system, answer gate questions, and create an audit-ready CAPA workflow.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* ── Step 1: Source Import ─────────────────────────────────────────── */}
      {step === 1 && (
        <WizardCard>
          <p
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--fg-4)",
              margin: "0 0 4px",
            }}
          >
            Step 1
          </p>
          <h2
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: "var(--fg-1)",
              margin: "0 0 6px",
              fontFamily: "var(--font-sans)",
            }}
          >
            Source import
          </h2>
          <p style={{ fontSize: "13px", color: "var(--fg-3)", margin: "0 0 24px", fontFamily: "var(--font-sans)" }}>
            Select a connected source system to auto-populate source data, or fill manually.
          </p>

          {/* Source system cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "12px" }}>
            {SOURCE_CARDS.map((card) => (
              <div
                key={card.type}
                style={{
                  background: "var(--bg-3)",
                  border: `1px solid ${selectedType === card.type && prefill ? card.color + "55" : "var(--line-2)"}`,
                  borderRadius: "var(--r-md)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  transition: "border-color 0.15s",
                }}
              >
                {/* System header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--fg-1)",
                        margin: "0 0 2px",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {card.system}
                    </p>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "10px",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        color: card.color,
                        background: card.color + "18",
                        padding: "1px 6px",
                        borderRadius: "var(--r-full)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {card.badge}
                    </span>
                  </div>
                  {/* Connected badge */}
                  <span
                    style={{
                      fontSize: "10px",
                      fontFamily: "var(--font-mono)",
                      color: "#3FB984",
                      background: "rgba(63,185,132,0.10)",
                      padding: "2px 7px",
                      borderRadius: "var(--r-full)",
                      fontWeight: 600,
                    }}
                  >
                    Connected
                  </span>
                </div>

                {/* Source ID */}
                <p
                  style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--fg-3)",
                    margin: 0,
                    background: "var(--bg-4)",
                    padding: "4px 8px",
                    borderRadius: "var(--r-sm)",
                    border: "1px solid var(--line-1)",
                  }}
                >
                  {card.sourceId}
                </p>

                {/* Description */}
                <p style={{ fontSize: "11px", color: "var(--fg-4)", margin: 0, fontFamily: "var(--font-sans)", lineHeight: "1.4" }}>
                  {card.description}
                </p>

                {/* Import button */}
                <button
                  onClick={() => handleImport(card.type, card.sourceId)}
                  disabled={isLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    background: selectedType === card.type && prefill ? card.color + "22" : "var(--bg-4)",
                    color: selectedType === card.type && prefill ? card.color : "var(--fg-2)",
                    border: `1px solid ${selectedType === card.type && prefill ? card.color + "55" : "var(--line-2)"}`,
                    borderRadius: "var(--r-sm)",
                    padding: "7px 0",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: isLoading ? "wait" : "pointer",
                    fontFamily: "var(--font-sans)",
                    marginTop: "auto",
                    width: "100%",
                    transition: "all 0.15s",
                  }}
                >
                  {isLoading && selectedType === card.type ? (
                    <>
                      <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
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
            ))}
          </div>

          {/* Manual option */}
          <button
            onClick={handleManualMode}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              gap: "8px",
              background: "transparent",
              color: "var(--fg-3)",
              border: "1px dashed var(--line-2)",
              borderRadius: "var(--r-md)",
              padding: "12px",
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            Fill manually without source import
            <ArrowRight size={13} />
          </button>

          {existingFinding?.linkedCapaId && (
            <div
              style={{
                marginTop: "16px",
                padding: "10px 14px",
                background: "var(--accent-soft)",
                border: "1px solid var(--accent-line)",
                borderRadius: "var(--r-sm)",
                fontSize: "12px",
                color: "var(--accent)",
                fontFamily: "var(--font-sans)",
              }}
            >
              <Sparkles size={12} style={{ display: "inline", marginRight: "6px" }} />
              This finding is already linked to {existingFinding.linkedCapaId}. Submitting will open the existing CAPA.
            </div>
          )}
        </WizardCard>
      )}

      {/* ── Step 2: Gate Questions ────────────────────────────────────────── */}
      {step === 2 && (
        <WizardCard>
          <p
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--fg-4)",
              margin: "0 0 4px",
            }}
          >
            Step 2
          </p>
          <h2
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: "var(--fg-1)",
              margin: "0 0 6px",
              fontFamily: "var(--font-sans)",
            }}
          >
            Gate questions
          </h2>
          <p style={{ fontSize: "13px", color: "var(--fg-3)", margin: "0 0 20px", fontFamily: "var(--font-sans)" }}>
            Answer questions to help Nova assess severity and scope. Be specific: include dates, batch numbers, and measurable observations.
          </p>

          {/* Nova tip */}
          <div
            style={{
              background: "var(--bg-3)",
              borderLeft: "3px solid var(--accent)",
              borderRadius: "var(--r-md)",
              padding: "12px 16px",
              marginBottom: "24px",
              display: "flex",
              gap: "10px",
            }}
          >
            <Sparkles size={14} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "1px" }} />
            <div>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent)", margin: "0 0 3px", fontFamily: "var(--font-sans)" }}>
                Nova tip
              </p>
              <p style={{ fontSize: "12px", color: "var(--fg-3)", margin: 0, fontFamily: "var(--font-sans)", lineHeight: "1.55" }}>
                Be specific about dates, batch numbers, and measurable observations. Vague answers will lower your quality score and may delay CAPA approval.
              </p>
            </div>
          </div>

          {/* Required questions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {GATE_QUESTIONS.filter((q) => q.required).map((q) => (
              <div key={q.id}>
                <FieldLabel required>{q.question}</FieldLabel>
                <StyledTextarea
                  value={gateAnswers[q.id]}
                  onChange={(v) => setGateAnswers((prev) => ({ ...prev, [q.id]: v }))}
                  placeholder={q.placeholder}
                  rows={4}
                />
              </div>
            ))}

            {/* Additional context */}
            <div
              style={{
                paddingTop: "18px",
                borderTop: "1px solid var(--line-1)",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--fg-4)",
                  margin: "0 0 16px",
                }}
              >
                Additional context (recommended)
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {GATE_QUESTIONS.filter((q) => !q.required).map((q) => (
                  <div key={q.id}>
                    <FieldLabel>{q.question}</FieldLabel>
                    <StyledTextarea
                      value={gateAnswers[q.id]}
                      onChange={(v) => setGateAnswers((prev) => ({ ...prev, [q.id]: v }))}
                      placeholder={q.placeholder}
                      rows={3}
                    />
                  </div>
                ))}
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
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--fg-4)",
              margin: "0 0 4px",
            }}
          >
            Step 3
          </p>
          <h2
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: "var(--fg-1)",
              margin: "0 0 6px",
              fontFamily: "var(--font-sans)",
            }}
          >
            Impact assessment
          </h2>
          <p style={{ fontSize: "13px", color: "var(--fg-3)", margin: "0 0 24px", fontFamily: "var(--font-sans)" }}>
            Select a severity level. Nova's recommendation is pre-filled if you imported source data.
          </p>

          {/* Nova AI assessment */}
          {impactClassification ? (
            <div
              style={{
                background: "var(--bg-3)",
                borderLeft: "3px solid var(--accent)",
                borderRadius: "var(--r-md)",
                padding: "14px 16px",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <Sparkles size={13} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Nova assessment
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    color: impactClassification.severity === "Minor" ? "#E0A33E" : "#E5575C",
                    background: impactClassification.severity === "Minor" ? "rgba(224,163,62,0.12)" : "rgba(229,87,92,0.12)",
                    padding: "1px 8px",
                    borderRadius: "var(--r-full)",
                    marginLeft: "4px",
                  }}
                >
                  {impactClassification.severity}
                </span>
                <span style={{ fontSize: "11px", color: "var(--fg-3)", marginLeft: "auto", fontFamily: "var(--font-mono)" }}>
                  {Math.round(impactClassification.totalWeight)}% confidence
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--fg-2)", margin: "0 0 10px", fontFamily: "var(--font-sans)", lineHeight: "1.55" }}>
                {impactClassification.rationale}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {impactClassification.factors.map((factor) => (
                  <div
                    key={factor.factor}
                    style={{
                      background: "var(--bg-4)",
                      borderRadius: "var(--r-sm)",
                      padding: "8px 10px",
                      border: "1px solid var(--line-1)",
                    }}
                  >
                    <p style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--fg-4)", margin: "0 0 3px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {factor.factor}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--fg-2)", margin: "0 0 4px", fontFamily: "var(--font-sans)" }}>
                      {factor.value}
                    </p>
                    <p style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--accent)", margin: 0 }}>
                      Weight {factor.weight}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "var(--bg-3)",
                border: "1px solid var(--line-1)",
                borderRadius: "var(--r-md)",
                padding: "12px 16px",
                marginBottom: "24px",
                display: "flex",
                gap: "10px",
              }}
            >
              <Sparkles size={13} style={{ color: "var(--fg-4)", flexShrink: 0, marginTop: "1px" }} />
              <p style={{ fontSize: "12px", color: "var(--fg-3)", margin: 0, fontFamily: "var(--font-sans)" }}>
                No source data was imported. Select a severity level manually based on your assessment.
              </p>
            </div>
          )}

          {/* Severity cards */}
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--fg-2)",
              margin: "0 0 10px",
              fontFamily: "var(--font-sans)",
            }}
          >
            Severity classification <span style={{ color: "#E5575C" }}>*</span>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "24px" }}>
            {SEVERITY_OPTIONS.map((opt) => {
              const isSelected = selectedSeverity === opt.value;
              const isNova = impactClassification?.severity === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setSelectedSeverity(opt.value)}
                  style={{
                    textAlign: "left",
                    background: isSelected ? opt.color + "15" : "var(--bg-3)",
                    border: `1px solid ${isSelected ? opt.color + "60" : "var(--line-2)"}`,
                    borderRadius: "var(--r-md)",
                    padding: "14px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    position: "relative",
                  }}
                >
                  {/* Nova recommendation badge */}
                  {isNova && (
                    <span
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        fontSize: "9px",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        color: "var(--accent)",
                        background: "var(--accent-soft)",
                        padding: "1px 5px",
                        borderRadius: "var(--r-full)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Nova
                    </span>
                  )}
                  {/* Radio indicator */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        border: `2px solid ${isSelected ? opt.color : "var(--line-3)"}`,
                        background: isSelected ? opt.color : "transparent",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isSelected && (
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--on-accent)" }} />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: isSelected ? opt.color : "var(--fg-2)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {opt.label}
                    </span>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--fg-3)", margin: 0, fontFamily: "var(--font-sans)", lineHeight: "1.45" }}>
                    {opt.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* CAPA title */}
          <div>
            <FieldLabel required>CAPA title</FieldLabel>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title for this CAPA"
              style={{
                width: "100%",
                background: "var(--bg-4)",
                border: "1px solid var(--line-2)",
                borderRadius: "var(--r-sm)",
                padding: "9px 12px",
                fontSize: "13px",
                color: "var(--fg-1)",
                fontFamily: "var(--font-sans)",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--line-2)";
                e.currentTarget.style.boxShadow = "none";
              }}
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
          <p
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--fg-4)",
              margin: "0 0 4px",
            }}
          >
            Step 4
          </p>
          <h2
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: "var(--fg-1)",
              margin: "0 0 6px",
              fontFamily: "var(--font-sans)",
            }}
          >
            Review & submit
          </h2>
          <p style={{ fontSize: "13px", color: "var(--fg-3)", margin: "0 0 24px", fontFamily: "var(--font-sans)" }}>
            Review the CAPA details before submitting. This will create the CAPA and open the 8D workflow.
          </p>

          {/* Summary cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Source summary */}
            <div
              style={{
                background: "var(--bg-3)",
                border: "1px solid var(--line-1)",
                borderRadius: "var(--r-md)",
                padding: "16px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--fg-4)",
                  margin: "0 0 12px",
                }}
              >
                Source data
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <ReviewField label="CAPA type" value={selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} />
                <ReviewField label="Source ID" value={sourceId} />
                <ReviewField label="System" value={prefill ? getPrefillSource(prefill) : "Manual entry"} />
                <ReviewField label="Severity" value={selectedSeverity} />
              </div>
              {title && (
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--line-1)" }}>
                  <ReviewField label="CAPA title" value={title} />
                </div>
              )}
            </div>

            {/* Imported source detail */}
            {prefill && (
              <div
                style={{
                  background: "var(--bg-3)",
                  border: "1px solid var(--line-1)",
                  borderRadius: "var(--r-md)",
                  padding: "16px",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--fg-4)",
                    margin: "0 0 12px",
                  }}
                >
                  Imported from {getPrefillSource(prefill)}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {getPrefillSummary(prefill).slice(0, 6).map(([label, value]) => (
                    <ReviewField key={label} label={label} value={value} />
                  ))}
                </div>
              </div>
            )}

            {/* Gate answers */}
            <div
              style={{
                background: "var(--bg-3)",
                border: "1px solid var(--line-1)",
                borderRadius: "var(--r-md)",
                padding: "16px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--fg-4)",
                  margin: "0 0 12px",
                }}
              >
                Gate questions
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {GATE_QUESTIONS.filter((q) => gateAnswers[q.id].trim()).map((q) => (
                  <ReviewField key={q.id} label={q.question} value={gateAnswers[q.id]} />
                ))}
                {!Object.values(gateAnswers).some((v) => v.trim()) && (
                  <p style={{ fontSize: "12px", color: "var(--fg-4)", margin: 0, fontFamily: "var(--font-sans)" }}>
                    No answers provided.
                  </p>
                )}
              </div>
            </div>

            {/* Readiness checklist */}
            <div
              style={{
                background: "var(--bg-3)",
                border: "1px solid var(--line-1)",
                borderRadius: "var(--r-md)",
                padding: "16px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--fg-4)",
                  margin: "0 0 12px",
                }}
              >
                Readiness check
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { label: "Source imported or manual mode selected", passed: Boolean(prefill) || manualMode },
                  { label: "Gate questions answered", passed: gateAnswers.observation.trim().length >= 20 },
                  { label: "Severity level selected", passed: Boolean(selectedSeverity) },
                  { label: "CAPA title provided", passed: title.trim().length >= 10 },
                  { label: "Nova impact classification", passed: Boolean(impactClassification) },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2
                      size={14}
                      style={{ flexShrink: 0, color: item.passed ? "#3FB984" : "var(--fg-4)" }}
                    />
                    <span
                      style={{
                        fontSize: "12px",
                        color: item.passed ? "var(--fg-2)" : "var(--fg-4)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit / Back */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "28px",
              paddingTop: "20px",
              borderTop: "1px solid var(--line-1)",
            }}
          >
            <button
              onClick={() => setStep(3)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "transparent",
                color: "var(--fg-3)",
                border: "1px solid var(--line-2)",
                borderRadius: "var(--r-sm)",
                padding: "8px 16px",
                fontSize: "13px",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              <ArrowLeft size={13} />
              Back
            </button>

            <button
              onClick={handleSubmit}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "var(--grad-brand)",
                color: "var(--on-accent)",
                border: "none",
                borderRadius: "var(--r-sm)",
                padding: "10px 28px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.01em",
              }}
            >
              Submit CAPA
              <ArrowRight size={15} />
            </button>
          </div>
        </WizardCard>
      )}
    </div>
  );
}
