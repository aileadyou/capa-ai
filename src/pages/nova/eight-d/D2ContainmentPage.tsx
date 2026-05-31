import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Circle, Save } from "lucide-react";
import { toast } from "sonner";
import { EightDShell, useEightDEmbed } from "@/components/layout/EightDShell";
import { NovaSuggestionBlock } from "@/components/nova/NovaSuggestionBlock";
import NotFound from "@/pages/NotFound";
import { useAuditTrailStore, useCapaStore, useNotificationStore } from "@/store";
import type { CAPACase } from "@/types";
import { computeContainmentStrength, computeTotalQualityScore } from "@/utils/scoring";

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

  const initialContainment = useMemo(() => {
    if (!capa) return { description: "", pic: "", dueDate: getDefaultDueDate() };
    return {
      description:
        getExistingContainment(capa)?.description ??
        containmentSuggestions[capa.id] ??
        "Immediately contain the affected product, system, or record scope and notify QA for documented assessment.",
      pic: getExistingContainment(capa)?.pic ?? "Siti Rahmawati",
      dueDate: getExistingContainment(capa)?.dueDate ?? getDefaultDueDate(),
    };
  }, [capa]);

  const [description, setDescription] = useState(initialContainment.description);
  const [pic, setPic] = useState(initialContainment.pic);
  const [dueDate, setDueDate] = useState(initialContainment.dueDate);

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
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div>
          <p
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              color: "var(--fg-3)",
              margin: "0 0 6px",
              letterSpacing: "0.18em",
            }}
          >
            {capa.id} · D2
          </p>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--fg-1)",
              margin: "0 0 8px",
              fontFamily: "var(--font-sans)",
            }}
          >
            Containment Action
          </h1>
          <p style={{ fontSize: "13px", color: "var(--fg-3)", margin: 0, lineHeight: "1.55", maxWidth: "600px" }}>
            Define immediate containment for {capa.id}. Nova checks that the action is clear, accountable, and time-bound before RCA can begin.
          </p>
        </div>

        {/* ── Nova suggestion block ────────────────────────────────────── */}
        <NovaSuggestionBlock
          context="containment action"
          suggestion={containmentSuggestions[capa.id] ?? initialContainment.description}
          reasoning={containmentReasoning[capa.id]}
          capaId={capa.id}
          suggestionId="d2-containment"
          onAccept={(content) => setDescription(content)}
        />

        {/* ── Containment form ─────────────────────────────────────────── */}
        <div
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            borderRadius: "var(--r-lg)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {/* Section label */}
          <p
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--fg-4)",
              margin: 0,
            }}
          >
            Containment Form
          </p>

          {/* Description */}
          <div>
            <label
              htmlFor="containment-action"
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--fg-2)",
                marginBottom: "8px",
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.02em",
              }}
            >
              Action description
            </label>
            <textarea
              id="containment-action"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Describe the immediate hold, quarantine, restriction, review, or assessment action."
              style={{
                width: "100%",
                background: "var(--bg-4)",
                border: `1px solid ${shouldShowBlocker ? "var(--danger)" : "var(--line-2)"}`,
                borderRadius: "var(--r-sm)",
                padding: "12px 14px",
                fontSize: "13px",
                lineHeight: "1.65",
                color: "var(--fg-1)",
                fontFamily: "var(--font-sans)",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color var(--dur-fast) var(--ease-out)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = shouldShowBlocker ? "var(--danger)" : "var(--line-2)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
              <span style={{ fontSize: "11px", color: "var(--fg-4)", fontFamily: "var(--font-mono)" }}>
                {description.length} chars
              </span>
              <span style={{ fontSize: "11px", color: passedCount === 4 ? "var(--accent)" : "var(--fg-4)", fontFamily: "var(--font-mono)" }}>
                {passedCount}/4 checks passing
              </span>
            </div>
          </div>

          {/* PIC + Due date row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* PIC */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--fg-2)",
                  marginBottom: "8px",
                  fontFamily: "var(--font-sans)",
                  letterSpacing: "0.02em",
                }}
              >
                Person in Charge
              </label>
              <div style={{ position: "relative" }}>
                <select
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  style={{
                    width: "100%",
                    appearance: "none",
                    background: "var(--bg-4)",
                    border: "1px solid var(--line-2)",
                    borderRadius: "var(--r-sm)",
                    padding: "9px 36px 9px 12px",
                    fontSize: "13px",
                    color: "var(--fg-1)",
                    fontFamily: "var(--font-sans)",
                    outline: "none",
                    cursor: "pointer",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--line-2)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {picOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <svg
                  width="12" height="12" viewBox="0 0 12 12"
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--fg-3)" }}
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
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--fg-2)",
                  marginBottom: "8px",
                  fontFamily: "var(--font-sans)",
                  letterSpacing: "0.02em",
                }}
              >
                Due date
              </label>
              <input
                id="containment-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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
          </div>
        </div>

        {/* ── Blocker banner ───────────────────────────────────────────── */}
        {shouldShowBlocker && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              padding: "12px 14px",
              background: "var(--danger-soft)",
              border: "1px solid color-mix(in srgb, var(--danger) 38%, transparent)",
              borderRadius: "var(--r-sm)",
            }}
          >
            <AlertTriangle size={15} style={{ color: "var(--danger)", flexShrink: 0, marginTop: "1px" }} />
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--danger)", margin: "0 0 2px", fontFamily: "var(--font-sans)" }}>
                Containment action is incomplete
              </p>
              <p style={{ fontSize: "12px", color: "var(--fg-3)", margin: 0, fontFamily: "var(--font-sans)" }}>
                Add a clear containment description with hold/quarantine/restrict language, assign a PIC, and set a due date.
              </p>
            </div>
          </div>
        )}

        {/* ── Quality checklist ────────────────────────────────────────── */}
        <div>
          <p
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--fg-4)",
              margin: "0 0 10px",
            }}
          >
            Quality Signals
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {validation.checks.map((check) => (
              <div
                key={check.label}
                style={{
                  display: "flex",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "var(--r-sm)",
                  background: check.passed ? "color-mix(in srgb, var(--success) 6%, transparent)" : "var(--bg-3)",
                  border: `1px solid ${check.passed ? "color-mix(in srgb, var(--success) 28%, transparent)" : "var(--line-1)"}`,
                }}
              >
                {check.passed ? (
                  <CheckCircle2 size={14} style={{ flexShrink: 0, color: "var(--success)", marginTop: "1px" }} />
                ) : (
                  <Circle size={14} style={{ flexShrink: 0, color: "var(--fg-4)", marginTop: "1px" }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "12px", fontWeight: check.passed ? 500 : 400, color: check.passed ? "var(--fg-2)" : "var(--fg-3)", margin: "0 0 2px", fontFamily: "var(--font-sans)" }}>
                    {check.label}
                  </p>
                  {!check.passed && (
                    <p style={{ fontSize: "11px", color: "var(--fg-4)", margin: 0, fontFamily: "var(--font-sans)" }}>
                      {check.hint}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Score preview ────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 14px",
            background: "var(--bg-3)",
            borderRadius: "var(--r-sm)",
            border: "1px solid var(--line-1)",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--fg-3)", fontFamily: "var(--font-sans)" }}>
            Containment score preview:
          </span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: containmentScore >= 20 ? "var(--success)" : containmentScore >= 12 ? "var(--warning)" : "var(--fg-2)",
            }}
          >
            {containmentScore}/25
          </span>
          <span style={{ fontSize: "12px", color: "var(--fg-4)", fontFamily: "var(--font-sans)" }}>
            · Total quality score: {previewScore.total}/100
          </span>
        </div>

        {/* ── Footer actions ───────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
            paddingTop: "8px",
            borderTop: "1px solid var(--line-1)",
          }}
        >
          <button
            onClick={() => saveContainment(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--bg-4)",
              color: "var(--fg-2)",
              border: "1px solid var(--line-2)",
              borderRadius: "var(--r-sm)",
              padding: "8px 16px",
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
            }}
          >
            <Save size={14} />
            Save Draft
          </button>
          <button
            onClick={() => saveContainment(true)}
            style={{
              background: "var(--grad-brand)",
              color: "var(--on-accent)",
              border: "none",
              borderRadius: "var(--r-sm)",
              padding: "8px 20px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              letterSpacing: "0.01em",
            }}
          >
            Continue to D3 Root Cause Analysis →
          </button>
        </div>

      </div>
    </EightDShell>
  );
}
