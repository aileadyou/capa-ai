import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, MessageSquareText, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BlockerBanner } from "@/components/shared/BlockerBanner";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { NovaCoachTip } from "@/components/nova/NovaCoachTip";
import { ScoreSidebar } from "@/components/score/ScoreSidebar";
import NotFound from "@/pages/NotFound";
import { eightDSteps } from "@/routes";
import { useAuditTrailStore, useCapaStore, useUIStore } from "@/store";
import type { VerificationData } from "@/types";
import { computeTotalQualityScore } from "@/utils/scoring";
import { formatCAPAType } from "@/utils/formatters";

type VerificationMethod = NonNullable<VerificationData["method"]>;

const verificationDefaults: Record<
  string,
  {
    method: VerificationMethod;
    result: string;
    evidence: string;
  }
> = {
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

function WorkflowSteps({ capaId }: { capaId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">8D Workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 md:grid-cols-7">
          {eightDSteps.map((step, index) => {
            const isCurrent = step === "verification";
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

function evaluateVerification(method: string, result: string, evidenceFileName: string) {
  const checks = [
    {
      label: "Verification method selected",
      passed: method.trim().length > 0,
    },
    {
      label: "Verification result documented",
      passed: result.trim().length >= 30,
    },
    {
      label: "Evidence filename uploaded",
      passed: evidenceFileName.trim().length > 0,
    },
  ];

  return {
    checks,
    isValid: checks.every((check) => check.passed),
  };
}

export function D6VerificationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const capa = useCapaStore((state) => (id ? state.getCAPAById(id) : undefined));
  const completeVerification = useCapaStore((state) => state.completeVerification);
  const updateCurrentStep = useCapaStore((state) => state.updateCurrentStep);
  const updateScore = useCapaStore((state) => state.updateScore);
  const addAuditEvent = useAuditTrailStore((state) => state.addEvent);
  const openNovaChat = useUIStore((state) => state.openNovaChat);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const defaults = capa
    ? verificationDefaults[capa.id] ?? {
        method: "process_review" as VerificationMethod,
        result: "",
        evidence: "",
      }
    : {
        method: "process_review" as VerificationMethod,
        result: "",
        evidence: "",
      };
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

  function uploadEvidence() {
    if (!evidenceFileName.trim()) {
      toast.error("Evidence upload blocked", {
        description: "Enter a mock filename before uploading.",
      });
      return;
    }

    toast.success("File uploaded", {
      description: evidenceFileName.trim(),
    });
  }

  function continueToSignOff() {
    setHasSubmitted(true);

    if (!validation.isValid || !method) {
      toast.error("Verification blocked", {
        description: "Method, result, and evidence filename are required before sign-off.",
      });
      return;
    }

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
    updateCurrentStep(capa.id, "signoff");
    navigate(`/capa/${capa.id}/8d/signoff`);
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
          <h1 className="text-2xl font-semibold tracking-tight">D6 Verification</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
            Record verification method, outcome, and mock evidence before the CAPA can move into sign-off.
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
              <CardTitle className="text-base">Verification Evidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Verification method</Label>
                <Select value={method} onValueChange={(value) => setMethod(value as VerificationMethod)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select verification method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_re_test">{methodLabels.em_re_test}</SelectItem>
                    <SelectItem value="process_review">{methodLabels.process_review}</SelectItem>
                    <SelectItem value="batch_trend">{methodLabels.batch_trend}</SelectItem>
                    <SelectItem value="re_sampling">{methodLabels.re_sampling}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-result">Verification result</Label>
                <Textarea
                  id="verification-result"
                  value={result}
                  onChange={(event) => setResult(event.target.value)}
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="evidence-file">Mock evidence upload</Label>
                <div className="flex flex-col gap-2 md:flex-row">
                  <Input
                    id="evidence-file"
                    value={evidenceFileName}
                    onChange={(event) => setEvidenceFileName(event.target.value)}
                    placeholder="Evidence filename.pdf"
                  />
                  <Button type="button" variant="outline" onClick={uploadEvidence}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
                {evidenceFileName && (
                  <div className="rounded border bg-muted/30 p-3 text-sm">
                    Uploaded evidence: <span className="font-medium">{evidenceFileName}</span>
                  </div>
                )}
              </div>

              {shouldShowBlocker && (
                <BlockerBanner
                  title="Verification is incomplete"
                  message="Verification method, result, and evidence filename are required before continuing to sign-off."
                />
              )}

              <div className="grid gap-3 md:grid-cols-3">
                {validation.checks.map((check) => (
                  <div key={check.label} className="flex gap-2 rounded border p-3 text-sm">
                    {check.passed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-ready" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className={check.passed ? "" : "text-muted-foreground"}>{check.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:justify-end">
                <Button type="button" variant="outline" onClick={() => openNovaChat({ step: "verification", capaId: id })}>
                  <MessageSquareText className="mr-2 h-4 w-4" />
                  Coach me on verification
                </Button>
                <Button type="button" onClick={continueToSignOff}>
                  Continue to Sign-Off
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <ScoreSidebar score={previewScore} />
          <NovaCoachTip>
            Verification evidence should prove the action worked, not only that the task was completed. Link evidence back to product impact, record behavior, trend review, or process control.
          </NovaCoachTip>
        </div>
      </div>

    </div>
  );
}
