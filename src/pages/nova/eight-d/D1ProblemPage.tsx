import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, MessageSquareText, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BlockerBanner } from "@/components/shared/BlockerBanner";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { NovaCoachTip } from "@/components/nova/NovaCoachTip";
import { ScoreSidebar } from "@/components/score/ScoreSidebar";
import NotFound from "@/pages/NotFound";
import { eightDSteps } from "@/routes";
import { useAuditTrailStore, useCapaStore, useUIStore } from "@/store";
import type { CAPACase } from "@/types";
import {
  computeProblemSpecificity,
  computeTotalQualityScore,
} from "@/utils/scoring";
import { formatCAPAType } from "@/utils/formatters";

const suggestedProblems: Record<string, string> = {
  "CAPA-2026-0341":
    "On 8 June 2026 during vaccine filling operation in Grade A Fill Suite Line FILL-02, environmental monitoring detected particle count excursion for batch VAX-2406-A17. The excursion lasted approximately 8 minutes and was associated with HEPA unit HEPA-FILL-02.",
  "CAPA-2026-0089":
    "During internal GMP audit AUD-2026-0089 on 10 June 2026, three warehouse material transfer records were found completed after the actual transfer time and missing second-person verification. The issue affected Warehouse Zone WH-02 and involved material movement records for lots MAT-2406-11, MAT-2406-12, and MAT-2406-13.",
  "CAPA-2026-0112":
    "On 12 June 2026, Hospital Sentosa reported visible particulate matter in one vial of Vaximmun 10-dose presentation, lot VX-2405-22, expiry May 2027. The complaint was received through Bizzmine Complaint module CMP-2026-0112 and requires investigation of visual inspection records, retained samples, and batch release documentation.",
};

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

function WorkflowSteps({ capaId }: { capaId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">8D Workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 md:grid-cols-7">
          {eightDSteps.map((step, index) => {
            const isCurrent = step === "problem";
            return (
              <Link
                key={step}
                to={`/capa/${capaId}/8d/${step}`}
                className={`rounded border px-3 py-2 text-xs font-medium transition ${
                  isCurrent
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                D{index + 1} {step === "ca" ? "CA" : step === "pa" ? "PA" : step}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function D1ProblemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rawCapa = useCapaStore((state) => state.capas.find((c) => c.id === id));
  const allCAs = useCapaStore((state) => state.correctiveActions);
  const allPAs = useCapaStore((state) => state.preventiveActions);
  const capa = useMemo(() => {
    if (!rawCapa) return undefined;
    return { ...rawCapa, correctiveActions: allCAs.filter((a) => a.capaId === rawCapa.id), preventiveActions: allPAs.filter((a) => a.capaId === rawCapa.id) };
  }, [rawCapa, allCAs, allPAs]);
  const updateProblemStatement = useCapaStore((state) => state.updateProblemStatement);
  const updateCurrentStep = useCapaStore((state) => state.updateCurrentStep);
  const addAuditEvent = useAuditTrailStore((state) => state.addEvent);
  const openNovaChat = useUIStore((state) => state.openNovaChat);
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
  const previewScore = computeTotalQualityScore({
    ...capa.score,
    problemSpecificity,
  });
  const validation = evaluateProblemStatement(statement, capa);
  const shouldShowBlocker = hasSubmitted && !validation.isValid;

  function saveProblem(advance: boolean) {
    setHasSubmitted(true);

    if (!validation.isValid) {
      toast.error("Problem statement blocked", {
        description: "Add date, location, equipment/system reference, batch or lot, and measurable observation.",
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <SeverityBadge severity={capa.impact.severity} />
            <StatusBadge status={capa.status} />
            <span className="rounded border bg-muted px-2.5 py-0.5 text-xs font-medium">
              {formatCAPAType(capa.type)}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">D1 Problem Statement</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
            Build a specific, measurable problem statement for {capa.id}. Nova checks whether the statement is strong enough for audit review before the workflow can continue.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to={`/capa/${capa.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to CAPA
          </Link>
        </Button>
      </div>

      <WorkflowSteps capaId={capa.id} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Nova Suggested Problem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="rounded border bg-muted/30 p-3 text-sm leading-6">
                {suggestedProblems[capa.id] ?? buildFallbackProblem(capa)}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStatement(suggestedProblems[capa.id] ?? buildFallbackProblem(capa))}
              >
                Use Nova Suggestion
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Problem Statement Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="problem-statement">Problem statement</Label>
                <Textarea
                  id="problem-statement"
                  value={statement}
                  onChange={(event) => setStatement(event.target.value)}
                  rows={8}
                  placeholder="Describe what happened, when, where, which system/product was affected, and the measurable issue."
                />
              </div>

              {shouldShowBlocker && (
                <BlockerBanner
                  title="Problem statement is not specific enough"
                  message="Add date, area/location, equipment or system reference, affected batch/lot or record scope, and measurable observation before continuing."
                />
              )}

              <div className="grid gap-3 md:grid-cols-2">
                {validation.checks.map((check) => (
                  <div key={check.label} className="flex gap-2 rounded border p-3 text-sm">
                    {check.passed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-ready" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                      <div className={check.passed ? "" : "text-muted-foreground"}>{check.label}</div>
                      {!check.passed && (
                        <div className="mt-0.5 text-xs text-nova/80">{check.hint}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:justify-end">
                <Button type="button" variant="outline" onClick={() => openNovaChat({ step: "problem", capaId: id })}>
                  <MessageSquareText className="mr-2 h-4 w-4" />
                  Ask Nova
                </Button>
                <Button type="button" variant="outline" onClick={() => saveProblem(false)}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
                <Button type="button" onClick={() => saveProblem(true)}>
                  Continue to Containment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <ScoreSidebar score={previewScore} />
          <NovaCoachTip>
            Add exact date or shift, the area or customer location, equipment or system reference, affected batch/lot or record scope, and a measurable observation. A strong D1 statement should make the investigation scope obvious without reading attachments.
          </NovaCoachTip>
        </div>
      </div>
    </div>
  );
}
