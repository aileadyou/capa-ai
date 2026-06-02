import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Circle, ListPlus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EightDShell, useEightDEmbed } from "@/components/layout/EightDShell";
import { NovaSuggestionBlock } from "@/components/nova/NovaSuggestionBlock";
import NotFound from "@/pages/NotFound";
import { useAuditTrailStore, useCapaStore } from "@/store";
import type { PreventiveAction } from "@/types";
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
  const map: Record<PreventiveAction["status"], { label: string; color: string; bg: string }> = {
    open: { label: "Open", color: "var(--fg-3)", bg: "var(--bg-3)" },
    in_progress: { label: "In Progress", color: "var(--warning)", bg: "var(--warning-soft)" },
    completed: { label: "Completed", color: "var(--success)", bg: "var(--success-soft)" },
    overdue: { label: "Overdue", color: "var(--danger)", bg: "var(--danger-soft)" },
    verified: { label: "Verified", color: "var(--accent)", bg: "var(--accent-soft)" },
  };
  const s = map[status] ?? map.open;
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        fontFamily: "var(--font-mono)",
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.color}40`,
        borderRadius: "var(--r-full)",
        padding: "2px 8px",
        whiteSpace: "nowrap",
      }}
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
    <div
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--line-2)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--line-1)",
          background: "var(--bg-3)",
        }}
      >
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
          Added Preventive Actions
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {actions.map((action, i) => (
          <div
            key={action.id}
            style={{
              padding: "14px 16px",
              borderBottom: i < actions.length - 1 ? "1px solid var(--line-1)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--accent)", fontWeight: 600 }}>
                    {action.id}
                  </span>
                  <ActionStatusBadge status={action.status} />
                </div>
                <p style={{ fontSize: "13px", color: "var(--fg-2)", margin: "0 0 10px", lineHeight: "1.55" }}>
                  {action.description}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div>
                    <p style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--fg-3)", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 3px" }}>PIC</p>
                    <p style={{ fontSize: "12px", color: "var(--fg-2)", margin: 0 }}>{action.pic}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--fg-3)", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 3px" }}>Target Date</p>
                    <p style={{ fontSize: "12px", color: "var(--fg-2)", margin: 0 }}>{formatDate(action.targetDate)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--fg-3)", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 3px" }}>Nova Generated</p>
                    <p style={{ fontSize: "12px", color: "var(--fg-2)", margin: 0 }}>{action.novaGenerated ? "Yes" : "No"}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onRemove(action.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--fg-4)",
                  padding: "4px",
                  borderRadius: "var(--r-sm)",
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--danger)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-4)"; }}
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

  const addPA = useCapaStore((state) => state.addPA);
  const removePA = useCapaStore((state) => state.removePA);
  const updateScore = useCapaStore((state) => state.updateScore);
  const updateCurrentStep = useCapaStore((state) => state.updateCurrentStep);
  const addAuditEvent = useAuditTrailStore((state) => state.addEvent);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const initialDescription = capa ? paSuggestions[capa.id] ?? "" : "";
  const [description, setDescription] = useState(initialDescription);
  const [pic, setPic] = useState("Siti Rahmawati");
  const [targetDate, setTargetDate] = useState(getDefaultTargetDate());

  if (!capa) {
    return <NotFound message={`CAPA ${id ?? ""} is not available in the demo dataset.`} />;
  }

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

  function handleRemovePA(actionId: string) {
    removePA(actionId);
    const remaining = currentActions.filter((a) => a.id !== actionId);
    const nextScore = computeTotalQualityScore({
      ...capa.score,
      effectiveness: computeActionEffectiveness(capa.correctiveActions, remaining),
    });
    updateScore(capa.id, nextScore);
    toast.info("Preventive action removed");
  }

  function addPreventiveAction() {
    setHasSubmitted(true);

    if (!validation.isValid) {
      toast.error("Preventive action blocked", {
        description: "Complete a forward-looking description, PIC, and future target date.",
      });
      return undefined;
    }

    const newAction = addPA(capa.id, {
      description: description.trim(),
      pic,
      targetDate: `${targetDate}T17:00:00+07:00`,
      status: "open",
      novaGenerated: true,
      novaSuggestionStatus: "accepted",
    });

    const nextActions = [...currentActions, newAction];
    const nextScore = computeTotalQualityScore({
      ...capa.score,
      effectiveness: computeActionEffectiveness(capa.correctiveActions, nextActions),
    });
    updateScore(capa.id, nextScore);
    addAuditEvent({
      actorName: "Nova Demo User",
      actorRole: "Initiator",
      domain: "system",
      eventType: "preventive_action_added",
      action: `Preventive action ${newAction.id} was added to ${capa.id}.`,
      capaId: capa.id,
      findingId: capa.findingId,
    });
    toast.success("Preventive action added", {
      description: `${newAction.id} is now available in CAPA detail and the global action store.`,
    });

    return newAction;
  }

  function continueToVerification() {
    setHasSubmitted(true);

    const hasValidAction = validExistingActionExists || validation.isValid;
    if (!hasValidAction) {
      toast.warning("Continuing without a complete preventive action", {
        description: "Nova will let you continue, but D5 still needs at least one preventive action with a future target date.",
      });
    } else if (!validExistingActionExists) {
      const added = addPreventiveAction();
      if (!added) return;
    }

    updateCurrentStep(capa.id, "verification");
    if (embedded && onStepChange) {
      onStepChange("verification");
    } else {
      navigate(`/capa/${capa.id}/8d/verification`);
    }
  }

  return (
    <EightDShell capaId={capa.id} activeStep="pa">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div>
          <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--fg-3)", margin: "0 0 6px", letterSpacing: "0.18em" }}>
            {capa.id} · D5
          </p>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--fg-1)", margin: "0 0 8px", fontFamily: "var(--font-sans)" }}>
            Preventive Action
          </h1>
          <p style={{ fontSize: "13px", color: "var(--fg-3)", margin: 0, lineHeight: "1.55", maxWidth: "600px" }}>
            Define preventive actions that reduce recurrence risk and strengthen the quality system beyond the immediate correction.
          </p>
        </div>

        {/* ── Existing actions ──────────────────────────────────────────── */}
        <ActionList actions={currentActions} onRemove={handleRemovePA} />

        {/* ── Nova suggestion block ────────────────────────────────────── */}
        <NovaSuggestionBlock
          context="preventive action"
          suggestion={paSuggestions[capa.id] ?? initialDescription}
          reasoning={paReasoning[capa.id]}
          capaId={capa.id}
          suggestionId="d5-pa"
          onAccept={(content) => setDescription(content)}
        />

        {/* ── Add PA form ───────────────────────────────────────────────── */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ListPlus size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
            <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-3)", margin: 0 }}>
              Add Preventive Action
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="pa-description" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--fg-2)", marginBottom: "8px", fontFamily: "var(--font-sans)", letterSpacing: "0.02em" }}>
              Description
            </label>
            <textarea
              id="pa-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              style={{
                width: "100%",
                background: "var(--field-bg)",
                border: `1px solid ${shouldShowBlocker && description.trim().length < 30 ? "var(--danger)" : "var(--line-2)"}`,
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
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          {/* PIC + Target date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--fg-2)", marginBottom: "8px", fontFamily: "var(--font-sans)", letterSpacing: "0.02em" }}>
                Person in Charge
              </label>
              <div style={{ position: "relative" }}>
                <select
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  style={{ width: "100%", appearance: "none", background: "var(--field-bg)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", padding: "9px 36px 9px 12px", fontSize: "13px", color: "var(--fg-1)", fontFamily: "var(--font-sans)", outline: "none", cursor: "pointer" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {picOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <svg width="12" height="12" viewBox="0 0 12 12" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--fg-3)" }} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>
            <div>
              <label htmlFor="pa-target-date" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--fg-2)", marginBottom: "8px", fontFamily: "var(--font-sans)", letterSpacing: "0.02em" }}>
                Target date
              </label>
              <input
                id="pa-target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                style={{ width: "100%", background: "var(--field-bg)", border: `1px solid ${shouldShowBlocker && !new Date(`${targetDate}T00:00:00`).getTime() ? "var(--danger)" : "var(--line-2)"}`, borderRadius: "var(--r-sm)", padding: "9px 12px", fontSize: "13px", color: "var(--fg-1)", fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
          </div>
        </div>

        {/* ── Blocker banner ───────────────────────────────────────────── */}
        {shouldShowBlocker && (
          <div style={{ display: "flex", gap: "10px", padding: "12px 14px", background: "var(--danger-soft)", border: "1px solid color-mix(in srgb, var(--danger) 38%, transparent)", borderRadius: "var(--r-sm)" }}>
            <AlertTriangle size={15} style={{ color: "var(--danger)", flexShrink: 0, marginTop: "1px" }} />
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--danger)", margin: "0 0 2px", fontFamily: "var(--font-sans)" }}>Preventive action is incomplete</p>
              <p style={{ fontSize: "12px", color: "var(--fg-3)", margin: 0, fontFamily: "var(--font-sans)" }}>
                Each PA needs a forward-looking description, PIC, and target date in the future before continuing.
              </p>
            </div>
          </div>
        )}

        {/* ── Quality signals ──────────────────────────────────────────── */}
        <div>
          <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-3)", margin: "0 0 10px" }}>
            Quality Signals
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {validation.checks.map((check) => (
              <div
                key={check.label}
                style={{ display: "flex", gap: "10px", padding: "10px 12px", borderRadius: "var(--r-sm)", background: check.passed ? "color-mix(in srgb, var(--success) 6%, transparent)" : "var(--bg-3)", border: `1px solid ${check.passed ? "color-mix(in srgb, var(--success) 28%, transparent)" : "var(--line-1)"}` }}
              >
                {check.passed ? (
                  <CheckCircle2 size={14} style={{ flexShrink: 0, color: "var(--success)", marginTop: "1px" }} />
                ) : (
                  <Circle size={14} style={{ flexShrink: 0, color: "var(--fg-4)", marginTop: "1px" }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "12px", fontWeight: check.passed ? 500 : 400, color: check.passed ? "var(--fg-2)" : "var(--fg-3)", margin: "0 0 2px", fontFamily: "var(--font-sans)" }}>{check.label}</p>
                  {!check.passed && <p style={{ fontSize: "11px", color: "var(--fg-4)", margin: 0, fontFamily: "var(--font-sans)" }}>{check.hint}</p>}
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "11px", color: passedCount === 4 ? "var(--accent)" : "var(--fg-4)", fontFamily: "var(--font-mono)", marginTop: "8px" }}>
            {passedCount}/4 checks passing
          </p>
        </div>

        {/* ── Footer actions ───────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", paddingTop: "8px", borderTop: "1px solid var(--line-1)" }}>
          <button
            onClick={addPreventiveAction}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--field-bg)", color: "var(--fg-2)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", padding: "8px 16px", fontSize: "13px", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 500 }}
          >
            <Save size={14} />
            Add PA
          </button>
          <button
            onClick={continueToVerification}
            style={{ background: "var(--grad-brand)", color: "var(--on-accent)", border: "none", borderRadius: "var(--r-sm)", padding: "8px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)", letterSpacing: "0.01em" }}
          >
            Continue to D6 Verification →
          </button>
        </div>

      </div>
    </EightDShell>
  );
}
