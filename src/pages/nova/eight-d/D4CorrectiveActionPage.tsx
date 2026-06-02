import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Circle, ListPlus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EightDShell, useEightDEmbed } from "@/components/layout/EightDShell";
import { NovaSuggestionBlock } from "@/components/nova/NovaSuggestionBlock";
import NotFound from "@/pages/NotFound";
import { useAuditTrailStore, useCapaStore } from "@/store";
import type { CorrectiveAction } from "@/types";
import { computeActionEffectiveness, computeTotalQualityScore } from "@/utils/scoring";
import { formatDate } from "@/utils/formatters";

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
  const map: Record<CorrectiveAction["status"], { label: string; color: string; bg: string }> = {
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
          Added Corrective Actions
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
                    <p style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--fg-3)", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 3px" }}>Due Date</p>
                    <p style={{ fontSize: "12px", color: "var(--fg-2)", margin: 0 }}>{formatDate(action.dueDate)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--fg-3)", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 3px" }}>Verification</p>
                    <p style={{ fontSize: "12px", color: "var(--fg-2)", margin: 0 }}>{action.verificationMethod}</p>
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

  const confirmedRootCauses = useMemo(
    () => capa?.rca.confirmedRootCauses.filter(Boolean) ?? [],
    [capa],
  );

  const initialDescription = capa ? caSuggestions[capa.id] ?? "" : "";
  const [description, setDescription] = useState(initialDescription);
  const [pic, setPic] = useState("Siti Rahmawati");
  const [dueDate, setDueDate] = useState(getDefaultDueDate());
  const [linkedRootCause, setLinkedRootCause] = useState(confirmedRootCauses[0] ?? "");
  const [verificationMethod, setVerificationMethod] = useState(
    "QA review of implementation evidence and documented effectiveness check.",
  );

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
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div>
          <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--fg-3)", margin: "0 0 6px", letterSpacing: "0.18em" }}>
            {capa.id} · D4
          </p>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--fg-1)", margin: "0 0 8px", fontFamily: "var(--font-sans)" }}>
            Corrective Action
          </h1>
          <p style={{ fontSize: "13px", color: "var(--fg-3)", margin: 0, lineHeight: "1.55", maxWidth: "600px" }}>
            Define corrective actions that address the confirmed root cause, assign ownership, and specify how effectiveness will be verified.
          </p>
        </div>

        {/* ── Existing actions ──────────────────────────────────────────── */}
        <ActionList actions={currentActions} onRemove={handleRemoveCA} />

        {/* ── Nova suggestion block ────────────────────────────────────── */}
        <NovaSuggestionBlock
          context="corrective action"
          suggestion={caSuggestions[capa.id] ?? initialDescription}
          reasoning={caReasoning[capa.id]}
          capaId={capa.id}
          suggestionId="d4-ca"
          onAccept={(content) => setDescription(content)}
        />

        {/* ── Add CA form ───────────────────────────────────────────────── */}
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
              Add Corrective Action
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="ca-description" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--fg-2)", marginBottom: "8px", fontFamily: "var(--font-sans)", letterSpacing: "0.02em" }}>
              Description
            </label>
            <textarea
              id="ca-description"
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

          {/* PIC + Due date */}
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
              <label htmlFor="ca-due-date" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--fg-2)", marginBottom: "8px", fontFamily: "var(--font-sans)", letterSpacing: "0.02em" }}>
                Due date
              </label>
              <input
                id="ca-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ width: "100%", background: "var(--field-bg)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", padding: "9px 12px", fontSize: "13px", color: "var(--fg-1)", fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {/* Linked root cause */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--fg-2)", marginBottom: "8px", fontFamily: "var(--font-sans)", letterSpacing: "0.02em" }}>
              Linked root cause
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={linkedRootCause}
                onChange={(e) => setLinkedRootCause(e.target.value)}
                style={{ width: "100%", appearance: "none", background: "var(--field-bg)", border: `1px solid ${shouldShowBlocker && linkedRootCause.trim().length < 20 ? "var(--danger)" : "var(--line-2)"}`, borderRadius: "var(--r-sm)", padding: "9px 36px 9px 12px", fontSize: "13px", color: "var(--fg-1)", fontFamily: "var(--font-sans)", outline: "none", cursor: "pointer" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                {confirmedRootCauses.length === 0 && (
                  <option value="" disabled>Complete D3 Root Cause Analysis first</option>
                )}
                {confirmedRootCauses.map((rc) => <option key={rc} value={rc}>{rc}</option>)}
              </select>
              <svg width="12" height="12" viewBox="0 0 12 12" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--fg-3)" }} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>

          {/* Verification method */}
          <div>
            <label htmlFor="verification-method" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--fg-2)", marginBottom: "8px", fontFamily: "var(--font-sans)", letterSpacing: "0.02em" }}>
              Verification method
            </label>
            <textarea
              id="verification-method"
              value={verificationMethod}
              onChange={(e) => setVerificationMethod(e.target.value)}
              rows={3}
              style={{ width: "100%", background: "var(--field-bg)", border: `1px solid ${shouldShowBlocker && verificationMethod.trim().length < 10 ? "var(--danger)" : "var(--line-2)"}`, borderRadius: "var(--r-sm)", padding: "12px 14px", fontSize: "13px", lineHeight: "1.65", color: "var(--fg-1)", fontFamily: "var(--font-sans)", resize: "vertical", outline: "none", boxSizing: "border-box", transition: "border-color var(--dur-fast) var(--ease-out)" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>
        </div>

        {/* ── Blocker banner ───────────────────────────────────────────── */}
        {shouldShowBlocker && (
          <div style={{ display: "flex", gap: "10px", padding: "12px 14px", background: "var(--danger-soft)", border: "1px solid color-mix(in srgb, var(--danger) 38%, transparent)", borderRadius: "var(--r-sm)" }}>
            <AlertTriangle size={15} style={{ color: "var(--danger)", flexShrink: 0, marginTop: "1px" }} />
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--danger)", margin: "0 0 2px", fontFamily: "var(--font-sans)" }}>Corrective action is incomplete</p>
              <p style={{ fontSize: "12px", color: "var(--fg-3)", margin: 0, fontFamily: "var(--font-sans)" }}>
                Complete description, PIC, due date, linked root cause, and verification method.
              </p>
            </div>
          </div>
        )}

        {/* ── Quality checklist ────────────────────────────────────────── */}
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
          <p style={{ fontSize: "11px", color: passedCount === 5 ? "var(--accent)" : "var(--fg-4)", fontFamily: "var(--font-mono)", marginTop: "8px" }}>
            {passedCount}/5 checks passing
          </p>
        </div>

        {/* ── Footer actions ───────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", paddingTop: "8px", borderTop: "1px solid var(--line-1)" }}>
          <button
            onClick={addCorrectiveAction}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--field-bg)", color: "var(--fg-2)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", padding: "8px 16px", fontSize: "13px", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 500 }}
          >
            <Save size={14} />
            Add CA
          </button>
          <button
            onClick={continueToPreventiveAction}
            style={{ background: "var(--grad-brand)", color: "var(--on-accent)", border: "none", borderRadius: "var(--r-sm)", padding: "8px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)", letterSpacing: "0.01em" }}
          >
            Continue to D5 Preventive Action →
          </button>
        </div>

      </div>
    </EightDShell>
  );
}
