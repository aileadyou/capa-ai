import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Circle, FileCheck, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { EightDShell, useEightDEmbed } from "@/components/layout/EightDShell";
import NotFound from "@/pages/NotFound";
import { useAuditTrailStore, useCapaStore } from "@/store";
import type { VerificationData } from "@/types";
import { cn } from "@/lib/utils";
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
      <div className="flex flex-col gap-6">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div>
          <p className="mb-1.5 mt-0 font-sans text-xs tracking-[0.18em] text-foreground-tertiary">
            {capa.id} · D6
          </p>
          <h1 className="mb-2 mt-0 font-sans text-[22px] font-bold text-foreground">
            Verification
          </h1>
          <p className="m-0 max-w-[600px] text-[13px] leading-[1.55] text-foreground-tertiary">
            Record verification method, outcome, and evidence before this CAPA can move into sign-off.
          </p>
        </div>

        {/* ── Verification form ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-[18px] rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <FileCheck size={15} className="shrink-0 text-primary" />
            <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">
              Verification Evidence
            </p>
          </div>

          {/* Verification method */}
          <div>
            <label className="mb-2 block font-sans text-xs font-semibold tracking-[0.02em] text-foreground-secondary">
              Verification method
            </label>
            <div className="relative">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as VerificationMethod)}
                className={cn(
                  "w-full cursor-pointer appearance-none rounded-[var(--r-sm)] border bg-[var(--field-bg)] py-[9px] pl-3 pr-9 font-sans text-[13px] text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]",
                  shouldShowBlocker && !method ? "border-destructive" : "border-[var(--line-2)]",
                )}
              >
                <option value="" disabled>Select verification method</option>
                <option value="em_re_test">{methodLabels.em_re_test}</option>
                <option value="process_review">{methodLabels.process_review}</option>
                <option value="batch_trend">{methodLabels.batch_trend}</option>
                <option value="re_sampling">{methodLabels.re_sampling}</option>
              </select>
              <svg width="12" height="12" viewBox="0 0 12 12" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>

          {/* Verification result */}
          <div>
            <label htmlFor="verification-result" className="mb-2 block font-sans text-xs font-semibold tracking-[0.02em] text-foreground-secondary">
              Verification result
            </label>
            <textarea
              id="verification-result"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              rows={6}
              placeholder="Describe the outcome of the verification — what was checked, what was found, and whether it confirms the corrective actions are effective."
              className={cn(
                "box-border w-full resize-y rounded-[var(--r-sm)] border bg-[var(--field-bg)] px-3.5 py-3 font-sans text-[13px] leading-[1.65] text-foreground outline-none transition-[border-color,box-shadow] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]",
                shouldShowBlocker && result.trim().length < 30 ? "border-destructive" : "border-[var(--line-2)]",
              )}
            />
          </div>

          {/* Evidence file */}
          <div>
            <label htmlFor="evidence-file" className="mb-2 block font-sans text-xs font-semibold tracking-[0.02em] text-foreground-secondary">
              Mock evidence upload
            </label>
            <div className="flex gap-2">
              <input
                id="evidence-file"
                value={evidenceFileName}
                onChange={(e) => setEvidenceFileName(e.target.value)}
                placeholder="Evidence filename.pdf"
                className={cn(
                  "flex-1 rounded-[var(--r-sm)] border bg-[var(--field-bg)] px-3 py-[9px] font-sans text-[13px] text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]",
                  shouldShowBlocker && !evidenceFileName.trim() ? "border-destructive" : "border-[var(--line-2)]",
                )}
              />
              <button
                type="button"
                onClick={uploadEvidence}
                className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-3.5 py-[9px] font-sans text-[13px] font-medium text-foreground-secondary"
              >
                <Upload size={13} />
                Upload
              </button>
            </div>
            {evidenceFileName && (
              <div className="mt-2 rounded-[var(--r-sm)] border border-success/30 bg-[var(--success-soft)] px-3 py-2 font-sans text-xs text-foreground-secondary">
                Uploaded: <span className="font-semibold">{evidenceFileName}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Blocker banner ───────────────────────────────────────────── */}
        {shouldShowBlocker && (
          <div className="flex gap-2.5 rounded-[var(--r-sm)] border border-destructive/40 bg-[var(--danger-soft)] px-3.5 py-3">
            <AlertTriangle size={15} className="mt-px shrink-0 text-destructive" />
            <div>
              <p className="mb-0.5 mt-0 font-sans text-[13px] font-semibold text-destructive">Verification is incomplete</p>
              <p className="m-0 font-sans text-xs text-foreground-tertiary">
                Verification method, result, and evidence filename are required before continuing to sign-off.
              </p>
            </div>
          </div>
        )}

        {/* ── Quality checklist ────────────────────────────────────────── */}
        <div>
          <p className="mb-2.5 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">
            Quality Signals
          </p>
          <div className="grid grid-cols-3 gap-2">
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
          <p className={cn("mt-2 font-sans text-[11px]", passedCount === 3 ? "text-primary" : "text-foreground-faint")}>
            {passedCount}/3 checks passing · Quality score preview: {previewScore.total}/100
          </p>
        </div>

        {/* ── Footer actions ───────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2.5 border-t border-border-subtle pt-2">
          <button
            onClick={() => {
              if (!method || !result.trim()) {
                toast.info("Fill in the form to save verification");
                return;
              }
              toast.success("Verification saved as draft");
            }}
            className="flex cursor-pointer items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-4 py-2 font-sans text-[13px] font-medium text-foreground-secondary"
          >
            <Save size={14} />
            Save Draft
          </button>
          <button
            onClick={continueToSignOff}
            className="cursor-pointer rounded-[var(--r-sm)] border-0 bg-[image:var(--grad-brand)] px-5 py-2 font-sans text-[13px] font-semibold tracking-[0.01em] text-primary-foreground"
          >
            Continue to D7 Sign-Off →
          </button>
        </div>

      </div>
    </EightDShell>
  );
}
