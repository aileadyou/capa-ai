import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Circle, FileCheck, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { EightDShell, useEightDEmbed } from "@/components/layout/EightDShell";
import { ApprovalChainPanel } from "@/components/capa/ApprovalChainPanel";
import { NovaSuggestionBlock } from "@/components/nova/NovaSuggestionBlock";
import { NovaAssistPanel } from "@/components/nova/NovaAssistPanel";
import NotFound from "@/pages/NotFound";
import {
  useAiSuggestion,
  useCapa,
  useCompleteVerification,
  useSaveVerificationDraft,
  useUpdateScore,
  useUpdateStep,
} from "@/hooks/api";
import type { VerificationData } from "@/types";
import { getCycleAtSeam, isCycleComplete } from "@/config/workflows";
import { cn } from "@/lib/utils";
import { computeTotalQualityScore } from "@/utils/scoring";

type VerificationMethod = NonNullable<VerificationData["method"]>;

// ── Per-type verification config ─────────────────────────────────────────────

const defaultMethodByType: Record<string, VerificationMethod> = {
  deviation: "em_re_test",
  audit: "process_review",
  complaint: "batch_trend",
};

const methodsByType: Record<string, VerificationMethod[]> = {
  deviation: ["em_re_test", "re_sampling", "process_requalification"],
  audit: ["process_review", "compliance_reaudit", "effectiveness_check"],
  complaint: ["batch_trend", "recurrence_trend", "customer_verification"],
};

const methodLabels: Record<VerificationMethod, string> = {
  // deviation
  em_re_test: "Environmental monitoring re-test & airflow requalification",
  re_sampling: "Re-sampling / re-testing of material or batch",
  process_requalification: "Process re-qualification / re-validation review",
  // audit
  process_review: "Process review & QA documentation spot-check",
  compliance_reaudit: "Follow-up audit / compliance re-inspection",
  effectiveness_check: "CAPA effectiveness check via direct observation",
  // complaint
  batch_trend: "Batch trend monitoring & release review",
  recurrence_trend: "Complaint recurrence trend review",
  customer_verification: "Customer response & feedback verification",
};

// ── Nova fallback text (seed CAPAs only) ─────────────────────────────────────

const novaFallbackByCapaId: Record<string, { result: string; evidence: string }> = {
  "CAPA-2026-0150": {
    result:
      "Post-replacement monitoring showed particle counts within alert and action limits for three consecutive checks. Airflow requalification passed acceptance criteria.",
    evidence: "HEPA-FILL-02-Requalification.pdf",
  },
  "CAPA-2026-0162": {
    result:
      "QA spot checks over four consecutive weeks found no late material transfer records and all sampled records contained completed second-person verification.",
    evidence: "WH-02-Documentation-Spot-Check-Summary.pdf",
  },
  "CAPA-2026-0127": {
    result:
      "QA review of 20 consecutive CS-01 cleaning verification packages found 100% swab map attachment presence, completed QA reviewer sign-off, and release checklist reconciliation before closure.",
    evidence: "CS-01-Cleaning-Verification-Spot-Check-Summary.pdf",
  },
  "CAPA-2026-0144": {
    result:
      "QA verified the revised Cartoner Line C2 line-clearance checklist includes leaflet-code verification, observed three consecutive domestic-carton changeovers with 100% material-code checklist completion, reconciled leaflet issuance and return quantities for batch HBV-26-0602-D, and found no repeated checklist omissions or leaflet reconciliation discrepancies across the 90-day follow-up window.",
    evidence: "C2-Line-Clearance-Verification-Summary.pdf",
  },
  "CAPA-2026-0106": {
    result:
      "Three subsequent batch release reviews showed completed visual inspection reconciliation checklist, no unexplained reject variance, and no repeated particulate complaint trend.",
    evidence: "Visual-Inspection-Reconciliation-Verification.pdf",
  },
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
  const { embedded, onStepChange, readOnly: isReadOnly } = useEightDEmbed();
  const { data: capa } = useCapa(id);

  const completeVerification = useCompleteVerification();
  const saveVerificationDraft = useSaveVerificationDraft();
  const updateStep = useUpdateStep();
  const updateScore = useUpdateScore();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [novaVerificationSuggestion, setNovaVerificationSuggestion] = useState("");
  const [novaVerificationReasoning, setNovaVerificationReasoning] = useState("");

  const { data: verificationAiResult } = useAiSuggestion<{
    Observation: string;
    Recommendation: string;
    "Audit Rationale": string;
  }>("verification", { capaId: capa?.id, capaType: capa?.type, enabled: Boolean(capa?.id) });

  const defaultMethod = capa
    ? (defaultMethodByType[capa.type] ?? "process_review") as VerificationMethod
    : ("process_review" as VerificationMethod);
  const novaFallback = capa ? (novaFallbackByCapaId[capa.id] ?? { result: "", evidence: "" }) : { result: "", evidence: "" };

  // Method keeps a sensible default selection, but the result narrative and
  // evidence start blank so QA documents the outcome themselves. Nova's draft
  // outcome is opt-in via the assist panel below the quality signals.
  const [method, setMethod] = useState<VerificationMethod | "">(capa?.verification.method ?? defaultMethod);
  const [result, setResult] = useState(capa?.verification.result ?? "");
  const [evidenceFileName, setEvidenceFileName] = useState(
    capa?.verification.evidenceFileNames[0] ?? "",
  );
  const [loadedVerificationKey, setLoadedVerificationKey] = useState<string | null>(null);

  useEffect(() => {
    if (!capa) return;
    const existingMethod = capa.verification.method ?? defaultMethod;
    const existingResult = capa.verification.result ?? "";
    const existingEvidence = capa.verification.evidenceFileNames?.[0] ?? "";
    const nextKey = `${capa.id}|${existingMethod}|${existingResult}|${existingEvidence}`;
    if (loadedVerificationKey === nextKey) return;

    setMethod(existingMethod);
    setResult(existingResult);
    setEvidenceFileName(existingEvidence);
    setLoadedVerificationKey(nextKey);
  }, [capa, defaultMethod, loadedVerificationKey]);

  useEffect(() => {
    if (!capa || !verificationAiResult) return;
    const coaching = verificationAiResult.data;
    setNovaVerificationSuggestion(coaching.Recommendation || novaFallback.result);
    setNovaVerificationReasoning(
      `${coaching.Observation}\n\nAudit rationale: ${coaching["Audit Rationale"]}`,
    );
  }, [verificationAiResult, capa, novaFallback.result]);

  if (!capa) {
    return <NotFound message={`CAPA ${id ?? ""} is not available in the demo dataset.`} />;
  }

  const verificationCycle = getCycleAtSeam(capa, "verification");
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

  const buildVerificationPayload = (includeVerifier: boolean): VerificationData => ({
    method: method || undefined,
    result: result.trim(),
    evidenceFileNames: evidenceFileName.trim() ? [evidenceFileName.trim()] : [],
    ...(includeVerifier ? { verifiedBy: "qa_deviation" } : {}),
  });

  const saveDraft = async () => {
    try {
      await saveVerificationDraft.mutateAsync({
        capaId: capa.id,
        verification: buildVerificationPayload(false),
      });
      toast.success("Verification draft saved", {
        description: `${capa.id} D6 data is now stored.`,
      });
    } catch (error) {
      toast.error("Could not save verification draft", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  // Complete verification only when all D6 checks pass. Otherwise persist the
  // draft so the user does not lose typed evidence while approval gates are open.
  const continueToSignOff = async () => {
    setHasSubmitted(true);
    const isComplete = validation.isValid && Boolean(method);

    try {
      if (!isComplete) {
        toast.warning("Continuing with incomplete verification", {
          description: "Nova will let you continue, but D6 still needs method, result, and evidence filename before final sign-off.",
        });
        await saveVerificationDraft.mutateAsync({
          capaId: capa.id,
          verification: buildVerificationPayload(false),
        });
      } else {
        await completeVerification.mutateAsync({
          capaId: capa.id,
          verification: buildVerificationPayload(true),
        });
        await updateScore.mutateAsync({ capaId: capa.id, score: previewScore });
      }

      if (verificationCycle && !isCycleComplete(capa, verificationCycle.stage)) {
        toast.error(`${verificationCycle.title} required`, {
          description: "D6 has been saved. All approvers must sign off before proceeding to sign-off.",
        });
        return;
      }

      await updateStep.mutateAsync({ capaId: capa.id, step: "signoff" });
      if (embedded && onStepChange) {
        onStepChange("signoff");
      } else {
        navigate(`/capa/${capa.id}/8d/signoff`);
      }
    } catch (error) {
      toast.error("Could not continue to sign-off", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  return (
    <EightDShell capaId={capa.id} activeStep="verification">
      <div className="flex flex-col gap-6">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div>
          <p className="mb-1.5 mt-0 font-sans text-xs tracking-[0.18em] text-primary">
            {capa.id} · D6
          </p>
          <h1 className="mb-2 mt-0 font-sans text-[22px] font-bold text-foreground">
            Verification
          </h1>
          <p className="m-0 max-w-[600px] text-[13px] leading-[1.55] text-foreground-tertiary">
            Record verification method, outcome, and evidence before this CAPA can move into sign-off. Nova can draft the result narrative below if you'd like a hand.
          </p>
        </div>

        {/* ── Verification form ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-[18px] rounded-[var(--r-lg)] border border-[var(--line-2)] bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <FileCheck size={15} className="shrink-0 text-primary" />
            <p className="m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Verification Evidence
            </p>
          </div>

          {/* Verification method */}
          <div>
            <label htmlFor="verification-method-select" className="mb-2 block font-sans text-xs font-semibold tracking-[0.02em] text-foreground-secondary">
              Verification method
            </label>
            <div className="relative">
              <select
                id="verification-method-select"
                value={method}
                onChange={(e) => setMethod(e.target.value as VerificationMethod)}
                aria-invalid={shouldShowBlocker && !method}
                className={cn(
                  "w-full cursor-pointer appearance-none rounded-[var(--r-sm)] border bg-[var(--field-bg)] py-[9px] pl-3 pr-9 font-sans text-[13px] text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]",
                  shouldShowBlocker && !method ? "border-destructive" : "border-[var(--line-2)]",
                )}
              >
                <option value="" disabled>Select verification method</option>
                {(methodsByType[capa.type] ?? []).map((m) => (
                  <option key={m} value={m}>{methodLabels[m]}</option>
                ))}
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
              disabled={isReadOnly}
              rows={6}
              aria-invalid={shouldShowBlocker && result.trim().length < 30}
              placeholder="Describe the outcome of the verification — what was checked, what was found, and whether it confirms the corrective actions are effective."
              className={cn(
                "box-border w-full resize-y rounded-[var(--r-sm)] border bg-[var(--field-bg)] px-3.5 py-3 font-sans text-[13px] leading-[1.65] text-foreground outline-none transition-[border-color,box-shadow] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)] disabled:cursor-not-allowed disabled:resize-none disabled:opacity-50",
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
                aria-invalid={shouldShowBlocker && !evidenceFileName.trim()}
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
          <div role="alert" className="flex gap-2.5 rounded-[var(--r-sm)] border border-destructive/40 bg-[var(--danger-soft)] px-3.5 py-3">
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
          <p className="mb-2.5 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
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

        {/* ── Nova assist (opt-in, below the user's own work) ──────────── */}
        {(novaVerificationSuggestion || novaFallback.result) && (
          <NovaAssistPanel
            title="Stuck? Let Nova draft the verification result"
            description="Document what QA actually checked in your own words. Nova's draft outcome is here if you'd like a reference."
          >
            <NovaSuggestionBlock
              context="verification result"
              suggestion={novaVerificationSuggestion || novaFallback.result}
              reasoning={
                novaVerificationReasoning ||
                `Based on the ${methodLabels[defaultMethod]} approach for ${capa.id}. Edit to match the evidence you actually reviewed.`
              }
              capaId={capa.id}
              suggestionId="d6-verification"
              onAccept={(content) => setResult(content)}
            />
          </NovaAssistPanel>
        )}

        {/* ── Footer actions ───────────────────────────────────────────── */}
        {!isReadOnly && (
          <div className="flex items-center justify-end gap-2.5 border-t border-border-subtle pt-2">
            <button
              onClick={saveDraft}
              disabled={saveVerificationDraft.isPending}
              className="flex cursor-pointer items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-4 py-2 font-sans text-[13px] font-medium text-foreground-secondary"
            >
              <Save size={14} />
              {saveVerificationDraft.isPending ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={continueToSignOff}
              className="cursor-pointer rounded-[var(--r-sm)] border-0 bg-[image:var(--grad-brand)] px-5 py-2 font-sans text-[13px] font-semibold tracking-[0.01em] text-primary-foreground"
            >
              Continue to D7 Sign-Off →
            </button>
          </div>
        )}

        {/* ── Workflow approval cycle attached at this seam (audit Actual) ─ */}
        {verificationCycle && <ApprovalChainPanel capa={capa} stage={verificationCycle.stage} />}

      </div>
    </EightDShell>
  );
}
