import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, DownloadCloud, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AILoadingSpinner } from "@/components/shared/AILoadingSpinner";
import { BlockerBanner } from "@/components/shared/BlockerBanner";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { ScoreSidebar } from "@/components/score/ScoreSidebar";
import { NovaCoachTip } from "@/components/nova/NovaCoachTip";
import { classifyImpact, importSourceData } from "@/services/novaService";
import { useCapaStore } from "@/store";
import type { CAPAType, GateQuestionID, ImpactClassification, PreFillContext, QualityScore } from "@/types";
import { computeProblemSpecificity, computeRootCauseDepth, computeTotalQualityScore } from "@/utils/scoring";
import { formatCAPAType, formatDateTime } from "@/utils/formatters";

const sourceIdByType: Record<CAPAType, string> = {
  deviation: "DEV-2026-0341",
  audit: "AUD-2026-0089",
  complaint: "CMP-2026-0112",
};

const fetchLabelByType: Record<CAPAType, string> = {
  deviation: "Fetch from Bizzmine",
  audit: "Fetch from Q100+",
  complaint: "Fetch from Bizzmine Complaint",
};

const loadingCopyByType: Record<CAPAType, string> = {
  deviation: "Nova is importing source data from Bizzmine...",
  audit: "Nova is importing audit finding data from Q100+...",
  complaint: "Nova is importing complaint data from Bizzmine Complaint...",
};

const submitLabelByType: Record<CAPAType, string> = {
  deviation: "Submit to QA",
  audit: "Submit to QA Compliance",
  complaint: "Submit to QA Complaint",
};

const gateQuestions: Array<{ id: GateQuestionID; question: string; placeholder: string }> = [
  {
    id: "observation",
    question: "What happened and when was it observed?",
    placeholder: "Include date, shift, area, and measurable observation.",
  },
  {
    id: "scope",
    question: "Which product, batch, lot, equipment, or area is affected?",
    placeholder: "Name affected batch/lot, equipment ID, area, and source record.",
  },
  {
    id: "impact",
    question: "What is the potential quality or GMP impact?",
    placeholder: "Explain why this should be treated as Minor, Major, or Critical.",
  },
  {
    id: "containment",
    question: "What immediate containment is already in place?",
    placeholder: "Describe hold, quarantine, restriction, or review actions.",
  },
  {
    id: "cause_confirmation",
    question: "What evidence is needed to confirm the root cause?",
    placeholder: "Mention records, trend review, sample assessment, or investigation method.",
  },
  {
    id: "effectiveness_criteria",
    question: "How will effectiveness be verified?",
    placeholder: "Define expected evidence and timeframe.",
  },
];

function isCAPAType(value: string | null): value is CAPAType {
  return value === "deviation" || value === "audit" || value === "complaint";
}

function getPrefillSource(prefill: PreFillContext) {
  if (prefill.source === "Bizzmine-Complaint") return "Bizzmine Complaint";
  return prefill.source;
}

function getSuggestedTitle(type: CAPAType, prefill?: PreFillContext) {
  if (!prefill) return `${formatCAPAType(type)} CAPA Intake`;
  if (prefill.source === "Bizzmine") return `CAPA for ${prefill.deviationId}: Environmental Monitoring Excursion`;
  if (prefill.source === "Q100+") return `CAPA for ${prefill.findingId}: GMP Documentation Gap`;
  return `CAPA for ${prefill.complaintId}: Visible Particulate Matter Complaint`;
}

function getPrefillSummary(prefill: PreFillContext) {
  if (prefill.source === "Bizzmine") {
    return [
      ["Deviation ID", prefill.deviationId],
      ["Reported", formatDateTime(prefill.reportedAt)],
      ["Occurred", formatDateTime(prefill.occurredAt)],
      ["Area", prefill.location.area],
      ["Line", prefill.location.line],
      ["Equipment ID", prefill.location.equipmentId],
      ["Affected Batches", prefill.affectedBatches.join(", ")],
      ["Initial Observation", prefill.initialObservation],
    ];
  }

  if (prefill.source === "Q100+") {
    return [
      ["Finding ID", prefill.findingId],
      ["Audit ID", prefill.auditId],
      ["Audit Date", formatDateTime(prefill.auditDate)],
      ["Auditor", `${prefill.auditor.name} · ${prefill.auditor.organization}`],
      ["Auditee", `${prefill.auditee.department} · ${prefill.auditee.contactPerson}`],
      ["Category", prefill.findingCategory],
      ["Regulation", prefill.regulationReference.join(", ")],
      ["Description", prefill.findingDescription],
    ];
  }

  return [
    ["Complaint ID", prefill.complaintId],
    ["Reported", formatDateTime(prefill.reportedAt)],
    ["Customer", `${prefill.customer.name} · ${prefill.customer.type}`],
    ["Product", prefill.product.name],
    ["Lot Number", prefill.product.lotNumber],
    ["Expiry Date", prefill.product.expiryDate],
    ["Complaint Type", prefill.complaintType],
    ["Description", prefill.description],
  ];
}

function computeIntakeScore(title: string, gateAnswers: Record<GateQuestionID, string>): QualityScore {
  const combinedAnswers = Object.values(gateAnswers).join(" ");
  const problemSpecificity = computeProblemSpecificity(`${title} ${combinedAnswers}`);
  const rootCauseDepth = computeRootCauseDepth([gateAnswers.cause_confirmation], 2);
  const effectiveness = Math.min(
    25,
    (gateAnswers.effectiveness_criteria.length >= 30 ? 12 : 4) +
      (gateAnswers.impact.length >= 30 ? 6 : 2) +
      (gateAnswers.scope.length >= 30 ? 5 : 1),
  );
  const containment = Math.min(
    25,
    (gateAnswers.containment.length >= 30 ? 14 : 4) +
      (/\b(hold|quarantine|restrict|review|assessment|sample)\b/i.test(gateAnswers.containment)
        ? 8
        : 0),
  );

  return computeTotalQualityScore({
    problemSpecificity,
    rootCauseDepth,
    effectiveness,
    containment,
  });
}

export function CapaIntakePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryType = searchParams.get("type");
  const querySourceId = searchParams.get("sourceId");
  const initialType = isCAPAType(queryType) ? queryType : "deviation";
  const [selectedType, setSelectedType] = useState<CAPAType>(initialType);
  const [sourceId, setSourceId] = useState(querySourceId ?? sourceIdByType[initialType]);
  const [prefill, setPrefill] = useState<PreFillContext | undefined>();
  const [impact, setImpact] = useState<ImpactClassification | undefined>();
  const [title, setTitle] = useState(getSuggestedTitle(initialType));
  const [isLoadingSource, setIsLoadingSource] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [gateAnswers, setGateAnswers] = useState<Record<GateQuestionID, string>>({
    observation: "",
    scope: "",
    impact: "",
    containment: "",
    cause_confirmation: "",
    effectiveness_criteria: "",
  });
  const createCAPAFromFinding = useCapaStore((state) => state.createCAPAFromFinding);
  const existingFinding = useCapaStore((state) =>
    state.findings.find((finding) => finding.id === sourceId),
  );

  useEffect(() => {
    if (!querySourceId) {
      setSourceId(sourceIdByType[selectedType]);
    }
    setPrefill(undefined);
    setImpact(undefined);
    setTitle(getSuggestedTitle(selectedType));
  }, [querySourceId, selectedType]);

  const score = useMemo(() => computeIntakeScore(title, gateAnswers), [gateAnswers, title]);
  const missingGateAnswers = gateQuestions.filter((question) => !gateAnswers[question.id].trim());
  const canSubmit = Boolean(prefill && impact && title.trim().length >= 10 && missingGateAnswers.length === 0);

  const handleFetchSource = async () => {
    setIsLoadingSource(true);
    setSubmitAttempted(false);
    try {
      const imported = await importSourceData(selectedType, sourceId);
      setPrefill(imported);
      const suggestedTitle = getSuggestedTitle(selectedType, imported);
      setTitle(suggestedTitle);
      setIsClassifying(true);
      const classification = await classifyImpact(imported);
      setImpact(classification);
      toast("Source data imported", {
        description: `Imported from ${getPrefillSource(imported)}.`,
      });
    } catch (error) {
      toast("Source data unavailable", {
        description: error instanceof Error ? error.message : "Nova could not import the selected source record.",
      });
    } finally {
      setIsLoadingSource(false);
      setIsClassifying(false);
    }
  };

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (!canSubmit) return;

    const capa = createCAPAFromFinding(sourceId, selectedType);
    if (!capa) {
      toast("CAPA could not be created", {
        description: "The selected source finding is not available in the demo dataset.",
      });
      return;
    }

    toast("CAPA ready", {
      description: `${capa.id} is ready for the 8D workflow.`,
    });
    navigate(`/capa/${capa.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New CAPA Intake</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Import mocked source data, let Nova classify impact, answer intake gate questions, and create an audit-ready CAPA workflow.
          </p>
        </div>
        <Button onClick={handleSubmit}>
          {submitLabelByType[selectedType]}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {submitAttempted && !canSubmit && (
        <BlockerBanner
          title="CAPA intake is incomplete"
          message="Import source data, keep a clear title, and answer all gate questions before submitting to QA."
        />
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Source Import</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-xs font-medium uppercase text-muted-foreground">CAPA Type</label>
                <Select value={selectedType} onValueChange={(value) => setSelectedType(value as CAPAType)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deviation">Deviation</SelectItem>
                    <SelectItem value="audit">Audit Finding</SelectItem>
                    <SelectItem value="complaint">Complaint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-muted-foreground">Source ID</label>
                <Input value={sourceId} onChange={(event) => setSourceId(event.target.value)} className="mt-1" />
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={handleFetchSource} disabled={isLoadingSource}>
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  {fetchLabelByType[selectedType]}
                </Button>
              </div>
            </CardContent>
          </Card>

          {(isLoadingSource || isClassifying) && (
            <AILoadingSpinner label={isLoadingSource ? loadingCopyByType[selectedType] : "Nova is analyzing..."} />
          )}

          {prefill && (
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-base">Imported Source Data</CardTitle>
                  <SourceBadge source={getPrefillSource(prefill)} />
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {getPrefillSummary(prefill).map(([label, value]) => (
                  <div key={label} className={label === "Description" || label === "Initial Observation" ? "md:col-span-2 xl:col-span-3" : ""}>
                    <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
                    <div className="mt-1 text-sm">{value}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">CAPA Draft</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium uppercase text-muted-foreground">Suggested CAPA Title</label>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1" />
              </div>
              {impact && (
                <div className="rounded border bg-muted/30 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-nova" />
                    <span className="text-sm font-medium">Nova Impact Classification</span>
                    <SeverityBadge severity={impact.severity} />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{impact.rationale}</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    {impact.factors.map((factor) => (
                      <div key={factor.factor} className="rounded border bg-background p-2 text-xs">
                        <div className="font-medium">{factor.factor}</div>
                        <div className="mt-1 text-muted-foreground">{factor.value}</div>
                        <div className="mt-1 text-primary">Weight {factor.weight}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!impact && (
                <NovaCoachTip>
                  Fetch source data first. Nova will classify all three golden demo cases as Major severity and explain the audit rationale.
                </NovaCoachTip>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gate Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {gateQuestions.map((question) => (
                <div key={question.id}>
                  <label className="text-sm font-medium">{question.question}</label>
                  <Textarea
                    value={gateAnswers[question.id]}
                    onChange={(event) =>
                      setGateAnswers((current) => ({
                        ...current,
                        [question.id]: event.target.value,
                      }))
                    }
                    placeholder={question.placeholder}
                    className="mt-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <ScoreSidebar score={score} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submission Check</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Source imported</span>
                <span className={prefill ? "text-status-ready" : "text-muted-foreground"}>{prefill ? "Ready" : "Missing"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Impact classified</span>
                <span className={impact ? "text-status-ready" : "text-muted-foreground"}>{impact ? "Ready" : "Missing"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Gate questions</span>
                <span className={missingGateAnswers.length === 0 ? "text-status-ready" : "text-muted-foreground"}>
                  {gateQuestions.length - missingGateAnswers.length}/{gateQuestions.length}
                </span>
              </div>
              {existingFinding?.linkedCapaId && (
                <div className="rounded border bg-primary/5 p-2 text-xs text-muted-foreground">
                  This source finding is already linked to {existingFinding.linkedCapaId}. Submit will open the existing CAPA.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

