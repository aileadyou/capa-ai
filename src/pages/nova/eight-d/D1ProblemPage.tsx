import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Circle, Save } from "lucide-react";
import { toast } from "sonner";
import { EightDShell } from "@/components/layout/EightDShell";
import { NovaSuggestionBlock } from "@/components/nova/NovaSuggestionBlock";
import NotFound from "@/pages/NotFound";
import { useAuditTrailStore, useCapaStore } from "@/store";
import type { CAPACase } from "@/types";
import {
  computeProblemSpecificity,
  computeTotalQualityScore,
} from "@/utils/scoring";

// ── Mock suggestion data ─────────────────────────────────────────────────────

const suggestedProblems: Record<string, string> = {
  "CAPA-2026-0341":
    "On 8 June 2026 during vaccine filling operation in Grade A Fill Suite Line FILL-02, environmental monitoring detected particle count excursion for batch VAX-2406-A17. The excursion lasted approximately 8 minutes and was associated with HEPA unit HEPA-FILL-02.",
  "CAPA-2026-0089":
    "During internal GMP audit AUD-2026-0089 on 10 June 2026, three warehouse material transfer records were found completed after the actual transfer time and missing second-person verification. The issue affected Warehouse Zone WH-02 and involved material movement records for lots MAT-2406-11, MAT-2406-12, and MAT-2406-13.",
  "CAPA-2026-0112":
    "On 12 June 2026, Hospital Sentosa reported visible particulate matter in one vial of Vaximmun 10-dose presentation, lot VX-2405-22, expiry May 2027. The complaint was received through Bizzmine Complaint module CMP-2026-0112 and requires investigation of visual inspection records, retained samples, and batch release documentation.",
};

const suggestionReasoning: Record<string, string> = {
  "CAPA-2026-0341":
    "Extracted from: Bizzmine deviation DEV-2026-0341 · Grade A Fill Suite FILL-02 · Batch VAX-2406-A17 · HEPA unit HEPA-FILL-02 · 8-minute excursion window · Environmental monitoring alert timestamp 2026-06-08.",
  "CAPA-2026-0089":
    "Extracted from: Q100+ audit AUD-2026-0089 · Audit date 2026-06-10 · WH-02 Warehouse Zone · Lots MAT-2406-11, MAT-2406-12, MAT-2406-13 · Regulation GMP documentation requirements · Missing second-person verification records.",
  "CAPA-2026-0112":
    "Extracted from: Bizzmine complaint CMP-2026-0112 · Product Vaximmun 10-dose · Lot VX-2405-22 · Expiry May 2027 · Hospital Sentosa · Report date 2026-06-12 · Visible particulate matter in complaint vial.",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getExistingProblemStatement(capa: CAPACase) {
  return capa.gateAnswers.find((answer) => answer.questionId === "observation")?.answer;
}

function buildFallbackProblem(capa: CAPACase) {
  if (capa.preFill.source === "Bizzmine") {
    return `${capa.preFill.initialObservation} The issue was reported on ${capa.preFill.reportedAt} in ${capa.preFill.location.area}, ${capa.preFill.location.line}, involving ${capa.preFill.location.equipmentId} and batches ${capa.preFill.affectedBatches.join(", ")}.`;
  }
  if (capa.preFill.source === "Q100+") {
    return `${capa.preFill.findingDescription} The issue was reported during ${capa.preFill.auditId} on ${capa.preFill.auditDate} for ${capa.preFill.auditee.department} and references ${capa.preFill.regulationReference.join(", ")}.`;
  }
  return `${capa.preFill.description} The complaint was reported on ${capa.preFill.reportedAt} for lot ${capa.preFill.product.lotNumber}, product ${capa.preFill.product.name}, and complaint record ${capa.preFill.complaintId}.`;
}

function evaluateProblemStatement(statement: string, capa: CAPACase) {
  const trimmed = statement.trim();
  const checks = [
    {
      label: "At least 50 characters",
      hint: "+2 pts — minimum length for a meaningful problem statement",
      passed: trimmed.length >= 50,
    },
    {
      label: "Date or audit timing",
      hint: "+3 pts — add exact date, shift, or audit reference",
      passed: /\b(\d{1,2}\s?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)|\d{4}-\d{2}-\d{2}|June|May|shift|audit)\b/i.test(trimmed),
    },
    {
      label: "Area or location",
      hint: "+3 pts — include room, line, zone, or customer location",
      passed: /\b(Grade|Suite|Room|Line|Area|Warehouse|Zone|Hospital|customer|location)\b/i.test(trimmed),
    },
    {
      label: capa.type === "audit" ? "System or record reference" : "Equipment or system reference",
      hint: "+3 pts — name the specific equipment ID, system, or record type",
      passed:
        capa.type === "audit"
          ? /\b(AUD|record|SOP|verification|Q100|GMP|system)\b/i.test(trimmed)
          : /\b(HEPA|equipment|line|vial|Bizzmine|visual|inspection|system)\b/i.test(trimmed),
    },
    {
      label: "Batch, lot, or scoped record count",
      hint: "+2 pts — include affected batch ID, lot number, or record count",
      passed: /\b(batch|lot|lots|VAC|VAX|VX|MAT|record|records|vial)\b/i.test(trimmed),
    },
    {
      label: "Measurable observation or clear issue",
      hint: "+3 pts — state the measured deviation, count, duration, or specific failure",
      passed: /\b(count|threshold|minutes|three|one|missing|verification|particulate|excursion|completed after)\b/i.test(trimmed),
    },
  ];

  return {
    checks,
    isValid: checks.every((check) => check.passed),
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export function D1ProblemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  const updateProblemStatement = useCapaStore((state) => state.updateProblemStatement);
  const updateCurrentStep = useCapaStore((state) => state.updateCurrentStep);
  const addAuditEvent = useAuditTrailStore((state) => state.addEvent);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const initialStatement = useMemo(() => {
    if (!capa) return "";
    return getExistingProblemStatement(capa) ?? suggestedProblems[capa.id] ?? buildFallbackProblem(capa);
  }, [capa]);

  const [statement, setStatement] = useState(initialStatement);

  if (!capa) {
    return <NotFound message={`CAPA ${id ?? ""} is not available in the demo dataset.`} />;
  }

  const problemSpecificity = computeProblemSpecificity(statement);
  const previewScore = computeTotalQualityScore({ ...capa.score, problemSpecificity });
  const validation = evaluateProblemStatement(statement, capa);
  const shouldShowBlocker = hasSubmitted && !validation.isValid;
  const passedCount = validation.checks.filter((c) => c.passed).length;

  function saveProblem(advance: boolean) {
    setHasSubmitted(true);

    if (!validation.isValid) {
      toast.error("Problem statement blocked", {
        description:
          "Add date, location, equipment/system reference, batch or lot, and measurable observation.",
      });
      return;
    }

    updateProblemStatement(capa.id, statement.trim(), previewScore);
    addAuditEvent({
      actorName: "Nova Demo User",
      actorRole: "Initiator",
      domain: "system",
      eventType: "problem_updated",
      action: `Problem statement updated for ${capa.id}.`,
      capaId: capa.id,
      findingId: capa.findingId,
    });

    if (advance) {
      updateCurrentStep(capa.id, "containment");
      addAuditEvent({
        actorName: "Nova Demo User",
        actorRole: "Initiator",
        domain: "system",
        eventType: "problem_updated",
        action: `D1 Problem Statement completed for ${capa.id}.`,
        capaId: capa.id,
        findingId: capa.findingId,
      });
      navigate(`/capa/${capa.id}/8d/containment`);
      return;
    }

    toast.success("Problem statement saved", {
      description: `${capa.id} specificity score is now ${problemSpecificity}/25.`,
    });
  }

  return (
    <EightDShell capaId={capa.id} activeStep="problem">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div>
          {/* CAPA ID breadcrumb */}
          <p
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              color: "var(--fg-3)",
              margin: "0 0 6px",
              letterSpacing: "0.04em",
            }}
          >
            {capa.id} · D1
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
            Problem Statement
          </h1>
          <p style={{ fontSize: "13px", color: "var(--fg-3)", margin: 0, lineHeight: "1.55", maxWidth: "600px" }}>
            Build a specific, measurable problem statement. Nova checks for six quality signals before the workflow can continue to D2 Containment.
          </p>
        </div>

        {/* ── Nova suggestion block ────────────────────────────────────── */}
        <NovaSuggestionBlock
          context="problem statement"
          suggestion={suggestedProblems[capa.id] ?? buildFallbackProblem(capa)}
          reasoning={suggestionReasoning[capa.id]}
          capaId={capa.id}
          suggestionId="d1-problem"
          onAccept={(content) => setStatement(content)}
        />

        {/* ── Statement editor ─────────────────────────────────────────── */}
        <div>
          <label
            htmlFor="problem-statement"
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
            Problem statement
          </label>
          <textarea
            id="problem-statement"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            rows={7}
            placeholder="Describe what happened, when, where, which system or product was affected, and the measurable issue."
            style={{
              width: "100%",
              background: "var(--bg-4)",
              border: `1px solid ${shouldShowBlocker ? "var(--error, #E05252)" : "var(--line-2)"}`,
              borderRadius: "var(--r-sm)",
              padding: "12px 14px",
              fontSize: "13px",
              lineHeight: "1.65",
              color: "var(--fg-1)",
              fontFamily: "var(--font-sans)",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = shouldShowBlocker ? "var(--error, #E05252)" : "var(--line-2)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "6px",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--fg-4)", fontFamily: "var(--font-mono)" }}>
              {statement.length} chars
            </span>
            <span style={{ fontSize: "11px", color: passedCount === 6 ? "var(--accent)" : "var(--fg-4)", fontFamily: "var(--font-mono)" }}>
              {passedCount}/6 checks passing
            </span>
          </div>
        </div>

        {/* ── Blocker banner ───────────────────────────────────────────── */}
        {shouldShowBlocker && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              padding: "12px 14px",
              background: "rgba(224, 82, 82, 0.08)",
              border: "1px solid rgba(224, 82, 82, 0.3)",
              borderRadius: "var(--r-sm)",
            }}
          >
            <AlertTriangle size={15} style={{ color: "#E05252", flexShrink: 0, marginTop: "1px" }} />
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#E05252", margin: "0 0 2px", fontFamily: "var(--font-sans)" }}>
                Problem statement is not specific enough
              </p>
              <p style={{ fontSize: "12px", color: "var(--fg-3)", margin: 0, fontFamily: "var(--font-sans)" }}>
                Add date, area/location, equipment or system reference, affected batch/lot or record scope, and measurable observation before continuing.
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
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--fg-4)",
              margin: "0 0 10px",
            }}
          >
            Quality Signals
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            {validation.checks.map((check) => (
              <div
                key={check.label}
                style={{
                  display: "flex",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "var(--r-sm)",
                  background: check.passed ? "rgba(52, 211, 153, 0.06)" : "var(--bg-3)",
                  border: `1px solid ${check.passed ? "rgba(52, 211, 153, 0.2)" : "var(--line-1)"}`,
                }}
              >
                {check.passed ? (
                  <CheckCircle2 size={14} style={{ flexShrink: 0, color: "#34D399", marginTop: "1px" }} />
                ) : (
                  <Circle size={14} style={{ flexShrink: 0, color: "var(--fg-4)", marginTop: "1px" }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: check.passed ? 500 : 400,
                      color: check.passed ? "var(--fg-2)" : "var(--fg-3)",
                      margin: "0 0 2px",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
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
            onClick={() => saveProblem(false)}
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
            onClick={() => saveProblem(true)}
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
            Continue to D2 Containment →
          </button>
        </div>

      </div>
    </EightDShell>
  );
}
