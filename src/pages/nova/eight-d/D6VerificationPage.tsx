import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Circle, FileCheck, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { EightDShell, useEightDEmbed } from "@/components/layout/EightDShell";
import NotFound from "@/pages/NotFound";
import { useAuditTrailStore, useCapaStore } from "@/store";
import type { VerificationData } from "@/types";
import { computeTotalQualityScore } from "@/utils/scoring";

type VerificationMethod = NonNullable<VerificationData["method"]>;

// ── Mock defaults ────────────────────────────────────────────────────────────

const verificationDefaults: Record<string, { method: VerificationMethod; result: string; evidence: string }> = {
  "CAPA-2026-0341": {
    method: "em_re_test",
    result:
      "Post-replacement monitoring showed particle counts within alert and action limits for three consecutive checks. Airflow requalification passed acceptance criteria.",
    evidence: "HEPA-FILL-02-Requalification.pdf",
  },
  "CAPA-2026-0089": {
    method: "process_review",
    result:
      "QA spot checks over four consecutive weeks found no late material transfer records and all sampled records contained completed second-person verification.",
    evidence: "WH-02-Documentation-Spot-Check-Summary.pdf",
  },
  "CAPA-2026-0112": {
    method: "batch_trend",
    result:
      "Three subsequent batch release reviews showed completed visual inspection reconciliation checklist, no unexplained reject variance, and no repeated particulate complaint trend.",
    evidence: "Visual-Inspection-Reconciliation-Verification.pdf",
  },
};

const methodLabels: Record<VerificationMethod, string> = {
  re_sampling: "Re-sampling",
  process_review: "Process review and QA spot check trend",
  batch_trend: "Process review and batch trend monitoring",
  em_re_test: "Environmental monitoring re-test and airflow requalification review",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function evaluateVerification(method: string, result: string, evidenceFileName: string) {
  const checks = [
    {
      label: "Verification method selected",
      hint: "Choose the method QA used to verify effectiveness",
      passed: method.trim().length > 0,
    },
    {
      label: "Verification result documented",
      hint: "Provide at least 30 characters describing the outcome",
      passed: result.trim().length >= 30,
    },
    {
      label: "Evidence filename uploaded",
      hint: "Reference a report, summary, or record file as evidence",
      passed: evidenceFileName.trim().length > 0,
    },
  ];

  return { checks, isValid: checks.every((c) => c.passed) };
}

// ── Component ────────────────────────────────────────────────────────────────

export function D6VerificationPage() {
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

  const completeVerification = useCapaStore((state) => state.completeVerification);
  const updateCurrentStep = useCapaStore((state) => state.updateCurrentStep);
  const updateScore = useCapaStore((state) => state.updateScore);
  const addAuditEvent = useAuditTrailStore((state) => state.addEvent);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const defaults = capa
    ? verificationDefaults[capa.id] ?? { method: "process_review" as VerificationMethod, result: "", evidence: "" }
    : { method: "process_review" as VerificationMethod, result: "", evidence: "" };

  const [method, setMethod] = useState<VerificationMethod | "">(capa?.verification.method ?? defaults.method);
  const [result, setResult] = useState(capa?.verification.result ?? defaults.result);
  const [evidenceFileName, setEvidenceFileName] = useState(
    capa?.verification.evidenceFileNames[0] ?? defaults.evidence,
  );

  if (!capa) {
    return <NotFound message={`CAPA ${id ?? ""} is not available in the demo dataset.`} />;
  }

  const validation = evaluateVerification(method, result, evidenceFileName);
  const previewScore = computeTotalQualityScore({
    ...capa.score,
    effectiveness: validation.isValid ? Math.max(capa.score.effectiveness, 23) : capa.score.effectiveness,
    containment: validation.isValid ? Math.max(capa.score.containment, 22) : capa.score.containment,
  });
  const shouldShowBlocker = hasSubmitted && !validation.isValid;
  const passedCount = validation.checks.filter((c) => c.passed).length;

  function uploadEvidence() {
    if (!evidenceFileName.trim()) {
      toast.error("Evidence upload blocked", { description: "Enter a mock filename before uploading." });
      return;
    }
    toast.success("File uploaded", { description: evidenceFileName.trim() });
  }

  function continueToSignOff() {
    setHasSubmitted(true);

    if (!validation.isValid || !method) {
      toast.warning("Continuing with incomplete verification", {
        description: "Nova will let you continue, but D6 still needs method, result, and evidence filename before final sign-off.",
      });
    } else {
      completeVerification(capa.id, {
        method,
        result: result.trim(),
        evidenceFileNames: [evidenceFileName.trim()],
        verifiedBy: "qa_deviation",
      });
      updateScore(capa.id, previewScore);
      addAuditEvent({
        actorName: "Nova Demo User",
        actorRole: "Initiator",
        domain: "system",
        eventType: "verification_completed",
        action: `Verification completed for ${capa.id}.`,
        capaId: capa.id,
        findingId: capa.findingId,
        after: `${methodLabels[method]} · ${evidenceFileName.trim()}`,
      });
    }

    updateCurrentStep(capa.id, "signoff");
    if (embedded && onStepChange) {
      onStepChange("signoff");
    } else {
      navigate(`/capa/${capa.id}/8d/signoff`);
    }
  }

  return (
    <EightDShell capaId={capa.id} activeStep="verification">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div>
          <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--fg-3)", margin: "0 0 6px", letterSpacing: "0.18em" }}>
            {capa.id} · D6
          </p>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--fg-1)", margin: "0 0 8px", fontFamily: "var(--font-sans)" }}>
            Verification
          </h1>
          <p style={{ fontSize: "13px", color: "var(--fg-3)", margin: 0, lineHeight: "1.55", maxWidth: "600px" }}>
            Record verification method, outcome, and evidence before this CAPA can move into sign-off.
          </p>
        </div>

        {/* ── Verification form ─────────────────────────────────────────── */}
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
            <FileCheck size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
            <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-3)", margin: 0 }}>
              Verification Evidence
            </p>
          </div>

          {/* Verification method */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--fg-2)", marginBottom: "8px", fontFamily: "var(--font-sans)", letterSpacing: "0.02em" }}>
              Verification method
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as VerificationMethod)}
                style={{ width: "100%", appearance: "none", background: "var(--bg-4)", border: `1px solid ${shouldShowBlocker && !method ? "var(--danger)" : "var(--line-2)"}`, borderRadius: "var(--r-sm)", padding: "9px 36px 9px 12px", fontSize: "13px", color: "var(--fg-1)", fontFamily: "var(--font-sans)", outline: "none", cursor: "pointer" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <option value="" disabled>Select verification method</option>
                <option value="em_re_test">{methodLabels.em_re_test}</option>
                <option value="process_review">{methodLabels.process_review}</option>
                <option value="batch_trend">{methodLabels.batch_trend}</option>
                <option value="re_sampling">{methodLabels.re_sampling}</option>
              </select>
              <svg width="12" height="12" viewBox="0 0 12 12" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--fg-3)" }} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>

          {/* Verification result */}
          <div>
            <label htmlFor="verification-result" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--fg-2)", marginBottom: "8px", fontFamily: "var(--font-sans)", letterSpacing: "0.02em" }}>
              Verification result
            </label>
            <textarea
              id="verification-result"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              rows={6}
              placeholder="Describe the outcome of the verification — what was checked, what was found, and whether it confirms the corrective actions are effective."
              style={{
                width: "100%",
                background: "var(--bg-4)",
                border: `1px solid ${shouldShowBlocker && result.trim().length < 30 ? "var(--danger)" : "var(--line-2)"}`,
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
              onBlur={(e) => { e.currentTarget.style.borderColor = shouldShowBlocker && result.trim().length < 30 ? "var(--danger)" : "var(--line-2)"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          {/* Evidence file */}
          <div>
            <label htmlFor="evidence-file" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--fg-2)", marginBottom: "8px", fontFamily: "var(--font-sans)", letterSpacing: "0.02em" }}>
              Mock evidence upload
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                id="evidence-file"
                value={evidenceFileName}
                onChange={(e) => setEvidenceFileName(e.target.value)}
                placeholder="Evidence filename.pdf"
                style={{
                  flex: 1,
                  background: "var(--bg-4)",
                  border: `1px solid ${shouldShowBlocker && !evidenceFileName.trim() ? "var(--danger)" : "var(--line-2)"}`,
                  borderRadius: "var(--r-sm)",
                  padding: "9px 12px",
                  fontSize: "13px",
                  color: "var(--fg-1)",
                  fontFamily: "var(--font-sans)",
                  outline: "none",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={uploadEvidence}
                style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-4)", color: "var(--fg-2)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", padding: "9px 14px", fontSize: "13px", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 500, whiteSpace: "nowrap" }}
              >
                <Upload size={13} />
                Upload
              </button>
            </div>
            {evidenceFileName && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "8px 12px",
                  background: "color-mix(in srgb, var(--success) 6%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--success) 28%, transparent)",
                  borderRadius: "var(--r-sm)",
                  fontSize: "12px",
                  color: "var(--fg-2)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Uploaded: <span style={{ fontWeight: 600 }}>{evidenceFileName}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Blocker banner ───────────────────────────────────────────── */}
        {shouldShowBlocker && (
          <div style={{ display: "flex", gap: "10px", padding: "12px 14px", background: "var(--danger-soft)", border: "1px solid color-mix(in srgb, var(--danger) 38%, transparent)", borderRadius: "var(--r-sm)" }}>
            <AlertTriangle size={15} style={{ color: "var(--danger)", flexShrink: 0, marginTop: "1px" }} />
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--danger)", margin: "0 0 2px", fontFamily: "var(--font-sans)" }}>Verification is incomplete</p>
              <p style={{ fontSize: "12px", color: "var(--fg-3)", margin: 0, fontFamily: "var(--font-sans)" }}>
                Verification method, result, and evidence filename are required before continuing to sign-off.
              </p>
            </div>
          </div>
        )}

        {/* ── Quality checklist ────────────────────────────────────────── */}
        <div>
          <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-3)", margin: "0 0 10px" }}>
            Quality Signals
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
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
          <p style={{ fontSize: "11px", color: passedCount === 3 ? "var(--accent)" : "var(--fg-4)", fontFamily: "var(--font-mono)", marginTop: "8px" }}>
            {passedCount}/3 checks passing · Quality score preview: {previewScore.total}/100
          </p>
        </div>

        {/* ── Footer actions ───────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", paddingTop: "8px", borderTop: "1px solid var(--line-1)" }}>
          <button
            onClick={() => {
              if (!method || !result.trim()) {
                toast.info("Fill in the form to save verification");
                return;
              }
              toast.success("Verification saved as draft");
            }}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-4)", color: "var(--fg-2)", border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", padding: "8px 16px", fontSize: "13px", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 500 }}
          >
            <Save size={14} />
            Save Draft
          </button>
          <button
            onClick={continueToSignOff}
            style={{ background: "var(--grad-brand)", color: "var(--on-accent)", border: "none", borderRadius: "var(--r-sm)", padding: "8px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)", letterSpacing: "0.01em" }}
          >
            Continue to D7 Sign-Off →
          </button>
        </div>

      </div>
    </EightDShell>
  );
}
