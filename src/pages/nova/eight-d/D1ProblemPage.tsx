import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Circle, Save } from "lucide-react";
import { toast } from "sonner";
import { EightDShell, useEightDEmbed } from "@/components/layout/EightDShell";
import { NovaSuggestionBlock } from "@/components/nova/NovaSuggestionBlock";
import NotFound from "@/pages/NotFound";
import { useAuditTrailStore, useCapaStore } from "@/store";
import type { CAPACase } from "@/types";
import { cn } from "@/lib/utils";
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
    "On 12 June 2026, Hospital Sentosa reported visible particulate matter in one vial of Vaximmun 10-dose presentation, lot VX-2405-22, expiry May 2027. The complaint was received through Bizzmine module CMP-2026-0112 and requires investigation of visual inspection records, retained samples, and batch release documentation.",
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

    if (!validation.isValid && !advance) {
      toast.error("Problem statement blocked", {
        description:
          "Add date, location, equipment/system reference, batch or lot, and measurable observation.",
      });
      return;
    }

    if (!validation.isValid && advance) {
      toast.warning("Continuing with incomplete problem statement", {
        description:
          "Nova will let you continue, but this step still needs date, location, equipment/system reference, batch or lot, and measurable observation.",
      });
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
      if (embedded && onStepChange) {
        onStepChange("containment");
      } else {
        navigate(`/capa/${capa.id}/8d/containment`);
      }
      return;
    }

    toast.success("Problem statement saved", {
      description: `${capa.id} specificity score is now ${problemSpecificity}/25.`,
    });
  }

  return (
    <EightDShell capaId={capa.id} activeStep="problem">
      <div className="flex flex-col gap-6">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div>
          {/* CAPA ID breadcrumb */}
          <p className="mb-1.5 mt-0 font-sans text-xs tracking-[0.18em] text-foreground-tertiary">
            {capa.id} · D1
          </p>
          <h1 className="mb-2 mt-0 font-sans text-[22px] font-bold text-foreground">
            Problem Statement
          </h1>
          <p className="m-0 max-w-[600px] text-[13px] leading-[1.55] text-foreground-tertiary">
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
            className="mb-2 block font-sans text-xs font-semibold tracking-[0.02em] text-foreground-secondary"
          >
            Problem statement
          </label>
          <textarea
            id="problem-statement"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            rows={7}
            placeholder="Describe what happened, when, where, which system or product was affected, and the measurable issue."
            className={cn(
              "box-border w-full resize-y rounded-[var(--r-sm)] border bg-[var(--field-bg)] px-3.5 py-3 font-sans text-[13px] leading-[1.65] text-foreground outline-none transition-[border-color,box-shadow] [transition-duration:var(--dur-fast)] [transition-timing-function:var(--ease-out)] focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-soft)]",
              shouldShowBlocker ? "border-destructive" : "border-[var(--line-2)]",
            )}
          />
          <div className="mt-1.5 flex justify-between">
            <span className="font-sans text-[11px] text-foreground-faint">
              {statement.length} chars
            </span>
            <span className={cn("font-sans text-[11px]", passedCount === 6 ? "text-primary" : "text-foreground-faint")}>
              {passedCount}/6 checks passing
            </span>
          </div>
        </div>

        {/* ── Blocker banner ───────────────────────────────────────────── */}
        {shouldShowBlocker && (
          <div className="flex gap-2.5 rounded-[var(--r-sm)] border border-destructive/40 bg-[var(--danger-soft)] px-3.5 py-3">
            <AlertTriangle size={15} className="mt-px shrink-0 text-destructive" />
            <div>
              <p className="mb-0.5 mt-0 font-sans text-[13px] font-semibold text-destructive">
                Problem statement is not specific enough
              </p>
              <p className="m-0 font-sans text-xs text-foreground-tertiary">
                Add date, area/location, equipment or system reference, affected batch/lot or record scope, and measurable observation before continuing.
              </p>
            </div>
          </div>
        )}

        {/* ── Quality checklist ────────────────────────────────────────── */}
        <div>
          <p className="mb-2.5 mt-0 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-faint">
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

        {/* ── Footer actions ───────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2.5 border-t border-border-subtle pt-2">
          <button
            onClick={() => saveProblem(false)}
            className="flex cursor-pointer items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--line-2)] bg-[var(--field-bg)] px-4 py-2 font-sans text-[13px] font-medium text-foreground-secondary"
          >
            <Save size={14} />
            Save Draft
          </button>
          <button
            onClick={() => saveProblem(true)}
            className="cursor-pointer rounded-[var(--r-sm)] border-0 bg-[image:var(--grad-brand)] px-5 py-2 font-sans text-[13px] font-semibold tracking-[0.01em] text-primary-foreground"
          >
            Continue to D2 Containment →
          </button>
        </div>

      </div>
    </EightDShell>
  );
}
